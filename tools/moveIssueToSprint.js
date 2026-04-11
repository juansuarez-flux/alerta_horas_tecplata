/**
 * tools/moveIssueToSprint.js
 * Tool: move_issue_to_sprint
 * Moves an issue to a specific sprint by setting its sprint_id.
 */

import { put } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

export const definition = {
  name: 'move_issue_to_sprint',
  description: 'Move an issue to a specific sprint.',
  inputSchema: {
    type: 'object',
    properties: {
      issue_id: {
        type: 'number',
        description: 'The numeric ID of the issue to move.',
      },
      sprint_id: {
        type: ['number', 'string'],
        description: 'The numeric ID or name of the target sprint.',
      },
      project_id: {
        type: 'string',
        description: 'Project ID where the target sprint is located (optional, but needed if passing name).',
      },
    },
    required: ['issue_id', 'sprint_id'],
  },
};

export async function handler({ issue_id, sprint_id, project_id }) {
  if (!issue_id) throw new Error('issue_id is required');
  if (!sprint_id) throw new Error('sprint_id is required');

  const projectData = await resolveProjectData(project_id);
  const resolved_sprint_id = await resolveSprintId(sprint_id, projectData.identifier);

  await put(`/issues/${issue_id}.json`, {
    issue: { sprint_id: resolved_sprint_id },
  });

  return {
    success: true,
    issue_id,
    sprint_id: resolved_sprint_id,
    message: `Issue #${issue_id} moved to sprint ${resolved_sprint_id}.`,
  };
}
