import { get } from '../redmineClient.js';
import { resolveProjectData, getIssueSubjects } from './utils.js';

export const definition = {
  name: 'get_time_entries',
  description: 'Retrieve spent time entries (hours log & comments) for a project, issue, or user, including resolved issue subjects. Also captures effort registered via Estimated Time property changes (journals) for specific work tasks.',
  inputSchema: {
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

/**
 * Returns true for "bolsa" tasks whose effort is recorded via the Spent
 * Time module (subject contains "Horas de Soporte").
 */
function isBolsaTask(subject = '') {
  return subject.toLowerCase().includes('horas de soporte');
}

/**
 * Fetches estimated_hours journal deltas for a single issue within the
 * given date range. Returns an array of synthetic time-entry objects.
 */
async function getEstimatedHoursDelta(issue, from, to) {
  try {
    const data = await get(`/issues/${issue.id}.json`, { include: 'journals' });
    const journals = data.issue?.journals || [];

    const fromDate = from ? (from.includes('T') ? new Date(from) : new Date(from + 'T00:00:00Z')) : null;
    const toDate   = to   ? (to.includes('T')   ? new Date(to)   : new Date(to + 'T23:59:59Z'))   : null;

    const syntheticEntries = [];

    for (const journal of journals) {
      const journalDate = new Date(journal.created_on);

      // Keep only journals whose created_on falls within the requested range
      if (fromDate && journalDate < fromDate) continue;
      if (toDate   && journalDate > toDate)   continue;

      for (const detail of (journal.details || [])) {
        if (detail.property === 'attr' && detail.name === 'estimated_hours') {
          const newVal = parseFloat(detail.new_value || '0');
          const oldVal = parseFloat(detail.old_value || '0');
          const delta  = Math.round((newVal - oldVal) * 100) / 100;

          if (delta <= 0) continue; // ignore reductions or no-ops

          const journalNotes = (journal.notes || '').trim();
          const notesText = journalNotes ? `. ${journalNotes}` : '';

          syntheticEntries.push({
            id: `est_${issue.id}_${journal.id}`,
            spent_on: journal.created_on.slice(0, 10),
            user_name: journal.user?.name || 'Desconocido',
            user_id: journal.user?.id,
            issue_id: issue.id,
            issue_subject: issue.subject,
            activity_name: 'Development',
            hours: delta,
            comments: `[Estimated Time] ${detail.old_value || '0'} → ${detail.new_value} hs${notesText}`,
            created_on: journal.created_on,
            source: 'estimated_hours',
          });
        }
      }
    }

    return syntheticEntries;
  } catch (e) {
    console.error(`Error fetching journals for issue ${issue.id}:`, e);
    return [];
  }
}

export async function handler(args) {
  const { project_id, issue_id, user_id, from, to, limit = 100 } = args;
  const projectData = await resolveProjectData(project_id);

  // ── 1. Spent Time entries (existing behaviour) ──────────────────────────
  const params = {
    project_id: projectData.id || projectData.identifier,
    limit,
  };

  if (issue_id) params.issue_id = issue_id;
  if (user_id)  params.user_id  = user_id;
  if (from && to) {
    params.spent_on = `><${from}|${to}`;
  } else if (from) {
    params.spent_on = `>=${from}`;
  } else if (to) {
    params.spent_on = `<=${to}`;
  }

  const data = await get('/time_entries.json', params);
  const rawEntries = data.time_entries || [];

  const issueIds = rawEntries.map(e => e.issue?.id).filter(Boolean);
  const subjects = await getIssueSubjects(issueIds);

  const spentTimeEntries = rawEntries.map(e => ({
    id: e.id,
    spent_on: e.spent_on,
    user_name: e.user?.name || 'Desconocido',
    user_id: e.user?.id,
    issue_id: e.issue?.id || null,
    issue_subject: e.issue?.id ? (subjects[e.issue.id] || null) : null,
    activity_name: e.activity?.name || 'General',
    hours: e.hours,
    comments: e.comments || '',
    created_on: e.created_on,
    source: 'spent_time',
  }));

  // ── 2. Estimated Hours via journal Property Changes ──────────────────────
  // Only run when a date range is provided and no single issue_id is requested,
  // because without a range we can't compute meaningful deltas.
  let estimatedEntries = [];

  if ((from || to) && !issue_id) {
    const issueParams = {
      project_id: projectData.id || projectData.identifier,
      status_id: '*',
      limit: 100,
    };

    // Filter issues updated within the requested range to avoid fetching
    // journals for every issue in the project.
    if (from && to) {
      issueParams.updated_on = `><${from}|${to}`;
    } else if (from) {
      issueParams.updated_on = `>=${from}`;
    } else if (to) {
      issueParams.updated_on = `<=${to}`;
    }

    const issuesData = await get('/issues.json', issueParams);
    const updatedIssues = issuesData.issues || [];

    // Only process non-bolsa tasks (specific work tasks)
    const specificIssues = updatedIssues.filter(i => !isBolsaTask(i.subject));

    // Fetch journal deltas in parallel (bounded by the ~100 issue limit)
    const deltaResults = await Promise.all(
      specificIssues.map(issue => getEstimatedHoursDelta(issue, from, to))
    );
    estimatedEntries = deltaResults.flat();
  }

  // ── 3. Merge, sort by date descending, and return ────────────────────────
  const timeEntries = [...spentTimeEntries, ...estimatedEntries].sort(
    (a, b) => new Date(b.spent_on) - new Date(a.spent_on)
  );

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

  return {
    project_id: projectData.identifier,
    total_entries: timeEntries.length,
    total_hours: Math.round(totalHours * 100) / 100,
    time_entries: timeEntries,
  };
}
