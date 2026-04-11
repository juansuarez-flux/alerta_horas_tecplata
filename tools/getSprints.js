/**
 * tools/getSprints.js
 * Tool: get_sprints
 * Lists all sprints for a given project from Redmine Agile.
 */

import { get } from '../redmineClient.js';
import { resolveProjectData } from './utils.js';

export const definition = {
  name: 'get_sprints',
  description: 'List all sprints (agile sprints) for a Redmine project.',
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

  return {
    project_id: projectData.identifier,
    total: sprints.length,
    sprints: sprints.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      start_date: s.start_date,
      end_date: s.end_date,
    })),
  };
}
