import { get } from '../redmineClient.js';

async function checkTareasProject() {
  try {
    console.log('1. Checking projects list...');
    const projectsData = await get('/projects.json', { limit: 100 });
    const projects = projectsData.projects || [];
    console.log('Projects found:', projects.map(p => ({ id: p.id, name: p.name, identifier: p.identifier })));

    const ticketIds = [34987, 34679, 35118, 35458, 35838, 36641, 36431, 35460, 36301];
    console.log('\n2. Fetching details and journals (comments) for tickets:', ticketIds);

    for (const id of ticketIds) {
      try {
        const issueData = await get(`/issues/${id}.json`, { include: 'journals,children,attachments' });
        const issue = issueData.issue;
        console.log(`\n--- Ticket #${issue.id}: ${issue.subject} ---`);
        console.log(`Project: ${issue.project?.name} (${issue.project?.id})`);
        console.log(`Status: ${issue.status?.name} | Priority: ${issue.priority?.name} | Assignee: ${issue.assigned_to?.name}`);
        console.log(`Created: ${issue.created_on} | Updated: ${issue.updated_on}`);
        console.log(`Description: ${issue.description || '(no description)'}`);
        
        const comments = (issue.journals || [])
          .filter(j => j.notes && j.notes.trim())
          .map(j => ({
            user: j.user?.name,
            date: j.created_on,
            notes: j.notes.trim()
          }));
        console.log('Comments count:', comments.length);
        if (comments.length > 0) {
          console.log('Latest comment:', comments[comments.length - 1]);
        }
      } catch (err) {
        console.error(`Error fetching ticket #${id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTareasProject();
