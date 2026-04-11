/**
 * tools/createIssue.js
 * Tool: create_issue
 * Creates a new issue in a Redmine project.
 */

import { post } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

export const definition = {
  name: 'create_issue',
  description: 'Create a new issue in a Redmine project.',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The project identifier (slug or numeric ID).',
      },
      subject: {
        type: 'string',
        description: 'Title/subject of the issue.',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the issue.',
      },
      tracker_id: {
        type: 'number',
        description: 'Tracker ID (e.g. 1=Bug, 2=Feature, 3=Support).',
      },
      priority_id: {
        type: 'number',
        description: 'Priority ID (optional, defaults to Normal).',
      },
      assigned_to_id: {
        type: 'number',
        description: 'User ID to assign the issue to (optional).',
      },
      estimated_hours: {
        type: 'number',
        description: 'Estimated hours for the issue (optional).',
      },
      sprint_id: {
        type: ['number', 'string'],
        description: 'Sprint ID or name to assign the issue to immediately (optional).',
      },
    },
    required: ['project_id', 'subject', 'tracker_id'],
  },
};

export async function handler({
  project_id,
  subject,
  description = '',
  tracker_id,
  priority_id,
  assigned_to_id,
  estimated_hours,
  sprint_id,
}) {
  if (!project_id) throw new Error('project_id is required');
  if (!subject) throw new Error('subject is required');
  if (!tracker_id) throw new Error('tracker_id is required');

  const projectData = await resolveProjectData(project_id);
  const resolved_sprint_id = sprint_id ? await resolveSprintId(sprint_id, projectData.identifier) : undefined;

  const issuePayload = {
    project_id: projectData.id,
    subject,
    description,
    tracker_id,
    ...(priority_id && { priority_id }),
    ...(assigned_to_id && { assigned_to_id }),
    ...(estimated_hours && { estimated_hours }),
    ...(resolved_sprint_id && { sprint_id: resolved_sprint_id }),
  };

  const data = await post('/issues.json', { issue: issuePayload });
  const issue = data.issue;

  return {
    success: true,
    issue: {
      id: issue.id,
      subject: issue.subject,
      status: issue.status?.name,
      priority: issue.priority?.name,
      tracker: issue.tracker?.name,
      project: issue.project?.name,
      created_on: issue.created_on,
      url: `${process.env.REDMINE_URL}/issues/${issue.id}`,
    },
  };
}
