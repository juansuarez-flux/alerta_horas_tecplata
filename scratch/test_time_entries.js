import { get } from '../redmineClient.js';
import { getIssueSubjects } from '../tools/utils.js';

async function generateFullReport() {
  try {
    const data = await get('/time_entries.json', {
      project_id: 'soporte-l3-2025-2026-requerimientos',
      limit: 100
    });
    const timeEntries = data.time_entries || [];

    const issueIds = timeEntries.map(e => e.issue?.id).filter(Boolean);
    const subjects = await getIssueSubjects(issueIds);

    const detailedEntries = timeEntries.map(entry => ({
      id: entry.id,
      date: entry.spent_on,
      user: entry.user?.name || 'Desconocido',
      userId: entry.user?.id,
      issueId: entry.issue?.id,
      issueSubject: subjects[entry.issue?.id] || `Tarea #${entry.issue?.id}`,
      activity: entry.activity?.name || 'General',
      hours: entry.hours,
      comments: entry.comments || '(Sin comentarios)'
    }));

    console.log(JSON.stringify(detailedEntries, null, 2));
  } catch (err) {
    console.error('Error generating report:', err);
  }
}

generateFullReport();
