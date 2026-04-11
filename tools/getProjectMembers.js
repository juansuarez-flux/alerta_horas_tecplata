/**
 * tools/getProjectMembers.js
 * Tool: get_project_members
 * Lists all members of a project to find assignable users.
 */

import { get } from '../redmineClient.js';
import { resolveProjectData } from './utils.js';

export const definition = {
  name: 'get_project_members',
  description: 'List all members of a project to find user IDs for assignments.',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The project identifier (slug or numeric ID).',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of members to return (default: 100).',
      },
    },
    required: ['project_id'],
  },
};

export async function handler({ project_id, limit = 100 }) {
  if (!project_id) throw new Error('project_id is required');

  const projectData = await resolveProjectData(project_id);
  
  const data = await get(`/projects/${projectData.identifier}/memberships.json`, {
    limit,
  });

  const memberships = data.memberships || [];
  
  return {
    project_id: projectData.identifier,
    total: data.total_count ?? memberships.length,
    members: memberships.map(m => ({
      user_id: m.user?.id,
      user_name: m.user?.name,
      roles: m.roles?.map(r => r.name) || []
    }))
  };
}
