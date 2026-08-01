import { get } from '../redmineClient.js';
import { resolveProjectData, getIssueSubjects } from './utils.js';

export const definition = {
  name: 'get_time_entries',
  description: 'Retrieve spent time entries (hours log & comments) for a project, issue, or user, including resolved issue subjects.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The project name, identifier slug, or numeric ID.',
      },
      issue_id: {
        type: 'number',
        description: 'Optional issue ID to filter time entries.',
      },
      user_id: {
        type: 'number',
        description: 'Optional user ID to filter time entries.',
      },
      from: {
        type: 'string',
        description: 'Optional start date (YYYY-MM-DD).',
      },
      to: {
        type: 'string',
        description: 'Optional end date (YYYY-MM-DD).',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of entries to return (default: 100).',
      },
    },
    required: ['project_id'],
  },
};

export async function handler(args) {
  const { project_id, issue_id, user_id, from, to, limit = 100 } = args;
  const projectData = await resolveProjectData(project_id);

  const params = {
    project_id: projectData.id || projectData.identifier,
    limit,
  };

  if (issue_id) params.issue_id = issue_id;
  if (user_id) params.user_id = user_id;
  if (from && to) {
    params.spent_on = `<>${from}|${to}`;
  } else if (from) {
    params.spent_on = `>=${from}`;
  } else if (to) {
    params.spent_on = `<=${to}`;
  }

  const data = await get('/time_entries.json', params);
  const rawEntries = data.time_entries || [];

  // Extract issue IDs to fetch subjects
  const issueIds = rawEntries.map(e => e.issue?.id).filter(Boolean);
  const subjects = await getIssueSubjects(issueIds);

  const timeEntries = rawEntries.map(e => ({
    id: e.id,
    spent_on: e.spent_on,
    user_name: e.user?.name || 'Desconocido',
    user_id: e.user?.id,
    issue_id: e.issue?.id,
    issue_subject: subjects[e.issue?.id] || null,
    activity_name: e.activity?.name || 'General',
    hours: e.hours,
    comments: e.comments || '',
    created_on: e.created_on,
  }));

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

  return {
    project_id: projectData.identifier,
    total_entries: timeEntries.length,
    total_hours: Math.round(totalHours * 100) / 100,
    time_entries: timeEntries,
  };
}
