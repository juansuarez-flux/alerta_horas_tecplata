/**
 * tools/updateIssueStatus.js
 * Tool: update_issue_status
 * Updates the status of a Redmine issue.
 */

import { put } from '../redmineClient.js';

export const definition = {
  name: 'update_issue_status',
  description: 'Update the status of an existing Redmine issue.',
  inputSchema: {
    type: 'object',
    properties: {
      issue_id: {
        type: 'number',
        description: 'The numeric ID of the issue.',
      },
      status_id: {
        type: 'number',
        description:
          'The numeric status ID. Common defaults: 1=New, 2=In Progress, 3=Resolved, 4=Feedback, 5=Closed, 6=Rejected.',
      },
      notes: {
        type: 'string',
        description: 'Optional note/comment to add when changing status.',
      },
    },
    required: ['issue_id', 'status_id'],
  },
};

export async function handler({ issue_id, status_id, notes }) {
  if (!issue_id) throw new Error('issue_id is required');
  if (!status_id) throw new Error('status_id is required');

  const payload = { status_id };
  if (notes) payload.notes = notes;

  await put(`/issues/${issue_id}.json`, { issue: payload });

  return {
    success: true,
    issue_id,
    status_id,
    message: `Issue #${issue_id} status updated to ID ${status_id}.`,
  };
}
