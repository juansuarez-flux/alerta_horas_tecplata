import { get } from '../redmineClient.js';

/**
 * Resolves a project name or ID into its official string identifier and numeric ID.
 */
export async function resolveProjectData(project_id) {
  if (!project_id) return { identifier: null, id: null };
  try {
    const projectsData = await get('/projects.json');
    const projects = projectsData.projects || [];
    const projectMatch = projects.find(
      p => p.name.toLowerCase() === project_id.toLowerCase() || 
           p.identifier.toLowerCase() === project_id.toLowerCase() ||
           String(p.id) === String(project_id)
    );
    if (projectMatch) {
      return { identifier: projectMatch.identifier, id: projectMatch.id };
    }
    return { identifier: project_id, id: project_id };
  } catch (e) {
    return { identifier: project_id, id: project_id };
  }
}

/**
 * Resolves a sprint name or ID into its numeric DB ID.
 */
export async function resolveSprintId(sprint_id, project_identifier) {
  if (!sprint_id) return sprint_id;
  if (typeof sprint_id === 'number') return sprint_id;

  if (!project_identifier) {
    const parsed = Number(sprint_id);
    if (isNaN(parsed)) throw new Error(`Need project context to resolve sprint name "${sprint_id}"`);
    return parsed;
  }

  try {
    const data = await get(`/projects/${project_identifier}/agile_sprints.json`);
    const sprints = data.agile_sprints || data.sprints || [];
    const target = String(sprint_id).trim().toLowerCase();

    let match = sprints.find(s => s.name?.toLowerCase() === target) ||
                sprints.find(s => s.name?.toLowerCase().includes(target)) ||
                sprints.find(s => s.name?.toLowerCase().endsWith(` ${sprint_id}`));

    if (match) return match.id;
    const parsed = Number(sprint_id);
    if (!isNaN(parsed)) return parsed;
    throw new Error(`Sprint "${sprint_id}" not found in project "${project_identifier}".`);
  } catch (error) {
    const parsed = Number(sprint_id);
    if (!isNaN(parsed)) return parsed;
    throw error;
  }
}

/**
 * Fetches subjects for a list of issue IDs efficiently.
 */
export async function getIssueSubjects(ids) {
  if (!ids || ids.length === 0) return {};
  const uniqueIds = [...new Set(ids)].filter(id => id);
  if (uniqueIds.length === 0) return {};

  try {
    // Redmine allows comma-separated IDs: /issues.json?issue_id=1,2,3
    const data = await get('/issues.json', {
      issue_id: uniqueIds.join(','),
      status_id: '*',
      limit: 100
    });
    
    const subjects = {};
    (data.issues || []).forEach(issue => {
      subjects[issue.id] = issue.subject;
    });
    return subjects;
  } catch (e) {
    console.error('Error fetching issue subjects:', e);
    return {};
  }
}
