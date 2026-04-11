/**
 * tools/updateIssue.js
 * Tool: update_issue
 * Updates an existing Redmine issue with various parameters.
 */

import { put } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

export const definition = {
  name: 'update_issue',
  description: 'Update one or more fields of an existing Redmine issue.',
  inputSchema: {
    type: 'object',
    properties: {
      issue_id: {
        type: 'number',
        description: 'The numeric ID of the issue to update.',
      },
      subject: {
        type: 'string',
        description: 'New title/subject of the issue.',
      },
      description: {
        type: 'string',
        description: 'New description of the issue.',
      },
      status_id: {
        type: 'number',
        description: 'The numeric status ID.',
      },
      priority_id: {
        type: 'number',
        description: 'The numeric priority ID.',
      },
      assigned_to_id: {
        type: 'number',
        description: 'User ID to assign the issue to.',
      },
      tracker_id: {
        type: 'number',
        description: 'The numeric tracker ID.',
      },
      estimated_hours: {
        type: 'number',
        description: 'Estimated hours for the issue.',
      },
      done_ratio: {
        type: 'number',
        description: 'Progress percentage (0-100).',
      },
      sprint_id: {
        type: ['number', 'string'],
        description: 'Sprint ID or name to move the issue to.',
      },
      project_id: {
        type: 'string',
        description: 'Project ID where the issue/sprint is located (needed if passing sprint name).',
      },
      parent_issue_id: {
        type: 'number',
        description: 'ID of the parent issue.',
      },
      fixed_version_id: {
        type: 'number',
        description: 'ID of the target version (milestone).',
      },
      category_id: {
        type: 'number',
        description: 'ID of the issue category.',
      },
      notes: {
        type: 'string',
        description: 'Comment/note to add to the issue update.',
      },
      start_date: {
        type: 'string',
        description: 'Start date (YYYY-MM-DD).',
      },
      due_date: {
        type: 'string',
        description: 'Due date (YYYY-MM-DD).',
      }
    },
    required: ['issue_id'],
  },
};

export async function handler(args) {
  const { issue_id, sprint_id, project_id, ...otherFields } = args;
  
  if (!issue_id) throw new Error('issue_id is required');

  const issuePayload = { ...otherFields };

  // If sprint_id is provided, resolve it
  if (sprint_id !== undefined && sprint_id !== null) {
    const projectData = await resolveProjectData(project_id);
    const resolved_sprint_id = await resolveSprintId(sprint_id, projectData.identifier);
    issuePayload.sprint_id = resolved_sprint_id;
  }

  await put(`/issues/${issue_id}.json`, { issue: issuePayload });

  return {
    success: true,
    issue_id,
    updated_fields: Object.keys(issuePayload),
    message: `Issue #${issue_id} has been updated successfully.`,
  };
}
