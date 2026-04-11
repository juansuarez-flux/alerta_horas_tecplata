/**
 * tools/getSprintIssues.js
 * Tool: get_sprint_issues
 * Fetches all issues that belong to a specific sprint.
 */

import { get } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData, getIssueSubjects } from './utils.js';

export const definition = {
  name: 'get_sprint_issues',
  description: 'Get all issues inside a specific sprint.',
  inputSchema: {
    type: 'object',
    properties: {
      sprint_id: {
        type: ['number', 'string'],
        description: 'The numeric ID or name of the sprint (e.g. 346 or "Sprint 14").',
      },
      project_id: {
        type: 'string',
        description: 'Project ID where the sprint is located (needed if passing sprint name).',
      },
    },
    required: ['sprint_id'],
  },
};

export async function handler({ sprint_id, project_id }) {
  if (sprint_id === undefined || sprint_id === null) {
    throw new Error('sprint_id is required');
  }

  const projectData = await resolveProjectData(project_id);
  const resolved_sprint_id = await resolveSprintId(sprint_id, projectData.identifier);

  const data = await get('/issues.json', {
    project_id: projectData.id,
    'f[]': ['agile_sprints', 'status_id'],
    'op[agile_sprints]': '=', // Redmine Agile filter fix: use '=' instead of '=='
    'v[agile_sprints][]': [resolved_sprint_id],
    'op[status_id]': '*',
    limit: 100,
  });

  const rawIssues = data.issues ?? [];
  
  // Resolve parent subjects
  const parentIds = rawIssues.filter(i => i.parent?.id).map(i => i.parent.id);
  const parentSubjects = await getIssueSubjects(parentIds);

  const issues = rawIssues.map(issue => {
    const base = mapIssue(issue);
    if (issue.parent?.id && parentSubjects[issue.parent.id]) {
      base.parent = {
        id: issue.parent.id,
        subject: parentSubjects[issue.parent.id]
      };
    }
    return base;
  }).sort((a, b) => b.id - a.id);

  return {
    sprint_id: resolved_sprint_id,
    total: issues.length,
    issues,
  };
}

function mapIssue(issue) {
  return {
    id: issue.id,
    subject: issue.subject,
    status: issue.status?.name,
    status_id: issue.status?.id,
    priority: issue.priority?.name,
    priority_id: issue.priority?.id,
    assigned_to: issue.assigned_to?.name ?? null,
    estimated_hours: issue.estimated_hours ?? null,
    done_ratio: issue.done_ratio ?? 0,
    parent: issue.parent ?? null,
    created_on: issue.created_on,
    updated_on: issue.updated_on,
  };
}
