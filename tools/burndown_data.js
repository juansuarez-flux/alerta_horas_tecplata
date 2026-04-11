/**
 * tools/burndown_data.js
 * Tool: burndown_data
 * Calculates total, completed, and remaining story points for a sprint.
 */

import { get } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

// Status IDs considered as "completed" (done)
const COMPLETED_STATUS_IDS = [3, 5, 6]; // Resolved, Closed, Rejected

export const definition = {
  name: 'burndown_data',
  description: 'Calculate total, completed, and remaining story points for a sprint.',
  inputSchema: {
    type: 'object',
    properties: {
      sprint_id: {
        type: ['number', 'string'],
        description: 'The numeric ID or name of the sprint.',
      },
      project_id: {
        type: 'string',
        description: 'Project ID where the sprint is located (needed if passing name).',
      },
    },
    required: ['sprint_id'],
  },
};

export async function handler({ sprint_id, project_id }) {
  if (!sprint_id) throw new Error('sprint_id is required');

  const projectData = await resolveProjectData(project_id);
  const resolved_sprint_id = await resolveSprintId(sprint_id, projectData.identifier);

  const data = await get('/issues.json', {
    project_id: projectData.id,
    'f[]': ['agile_sprints', 'status_id'],
    'op[agile_sprints]': '=',
    'v[agile_sprints][]': [resolved_sprint_id],
    'op[status_id]': '*',
    limit: 100,
  });

  const issues = data.issues ?? [];
  
  let totalPoints = 0;
  let completedPoints = 0;

  for (const issue of issues) {
    // Attempt to extract story points either from a native field or a custom field
    let points = issue.story_points ?? 0;
    
    // If not a native field, look in custom_fields
    if (!points && issue.custom_fields) {
      const spField = issue.custom_fields.find(
        (cf) => cf.name.toLowerCase().includes('story point')
      );
      if (spField && spField.value) {
        points = Number(spField.value) || 0;
      }
    }

    totalPoints += points;

    if (COMPLETED_STATUS_IDS.includes(issue.status?.id)) {
      completedPoints += points;
    }
  }

  return {
    sprint_id: resolved_sprint_id,
    total_points: totalPoints,
    completed_points: completedPoints,
    remaining_points: totalPoints - completedPoints,
  };
}
