/**
 * tools/getBacklog.js
 * Tool: get_backlog
 * Lists all issues that do NOT belong to any sprint (the product backlog).
 */

import { get } from '../redmineClient.js';
import { resolveProjectData, getIssueSubjects } from './utils.js';

export const definition = {
  name: 'get_backlog',
  description:
    'Get all backlog issues for a project (issues not assigned to any sprint).',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The project identifier (slug or numeric ID).',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of issues to return (default: 100).',
      },
    },
    required: ['project_id'],
  },
};

export async function handler({ project_id, limit = 100 }) {
  if (!project_id) {
    throw new Error('project_id is required');
  }

  const projectData = await resolveProjectData(project_id);
  const data = await get('/issues.json', {
    project_id: projectData.id,
    'sprint_id': '!*',  // issues with no sprint assigned
    limit,
    status_id: 'open',
  });

  const rawIssues = data.issues ?? [];
  
  // Resolve parent subjects
  const parentIds = rawIssues.filter(i => i.parent?.id).map(i => i.parent.id);
  const parentSubjects = await getIssueSubjects(parentIds);

  const issues = rawIssues.map((issue) => ({
    id: issue.id,
    subject: issue.subject,
    status: issue.status?.name,
    priority: issue.priority?.name,
    priority_id: issue.priority?.id,
    tracker: issue.tracker?.name,
    estimated_hours: issue.estimated_hours ?? null,
    assigned_to: issue.assigned_to?.name ?? null,
    parent: (issue.parent?.id && parentSubjects[issue.parent.id]) 
      ? { id: issue.parent.id, subject: parentSubjects[issue.parent.id] } 
      : (issue.parent ?? null),
    created_on: issue.created_on,
  }));

  return {
    project_id: projectData.identifier,
    total: data.total_count ?? issues.length,
    issues,
  };
}
