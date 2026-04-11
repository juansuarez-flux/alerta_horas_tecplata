/**
 * tools/getCurrentSprint.js
 * Tool: get_current_sprint
 * Detects the active sprint by comparing today's date with sprint date ranges.
 */

import { get } from '../redmineClient.js';
import { resolveProjectData } from './utils.js';

export const definition = {
  name: 'get_current_sprint',
  description:
    'Detect the currently active sprint for a project (start_date <= today <= end_date).',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The project identifier (slug or numeric ID).',
      },
    },
    required: ['project_id'],
  },
};

export async function handler({ project_id }) {
  if (!project_id) {
    throw new Error('project_id is required');
  }

  const projectData = await resolveProjectData(project_id);
  const data = await get(`/projects/${projectData.identifier}/agile_sprints.json`);
  const sprints = data.agile_sprints ?? data.sprints ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = sprints.find((s) => {
    if (!s.start_date || !s.end_date) return false;
    const start = new Date(s.start_date);
    const end = new Date(s.end_date);
    return start <= today && today <= end;
  });

  if (!current) {
    return {
      project_id: projectData.identifier,
      current_sprint: null,
      message: 'No active sprint found for today.',
    };
  }

  return {
    project_id,
    current_sprint: {
      id: current.id,
      name: current.name,
      status: current.status,
      start_date: current.start_date,
      end_date: current.end_date,
    },
  };
}
