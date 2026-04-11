/**
 * tools/developer_workload.js
 * Tool: developer_workload
 * Groups sprint issues by assigned developer and calculates issue count and story points per developer.
 */

import { get } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

export const definition = {
  name: 'developer_workload',
  description: 'Compute workload (number of issues and story points) per developer in a sprint.',
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
  const workloadMap = new Map();

  for (const issue of issues) {
    const assigneeName = issue.assigned_to?.name ?? 'Unassigned';
    
    let points = issue.story_points ?? 0;
    if (!points && issue.custom_fields) {
      const spField = issue.custom_fields.find(
        (cf) => cf.name.toLowerCase().includes('story point')
      );
      if (spField && spField.value) {
        points = Number(spField.value) || 0;
      }
    }

    if (!workloadMap.has(assigneeName)) {
      workloadMap.set(assigneeName, {
        name: assigneeName,
        issues: 0,
        story_points: 0,
      });
    }

    const devData = workloadMap.get(assigneeName);
    devData.issues += 1;
    devData.story_points += points;
  }

  // Convert map to array and sort by number of issues descending
  const developers = Array.from(workloadMap.values()).sort((a, b) => b.issues - a.issues);

  return {
    sprint_id: resolved_sprint_id,
    developers,
  };
}
