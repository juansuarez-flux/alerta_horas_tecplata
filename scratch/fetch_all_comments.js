import { get } from '../redmineClient.js';

async function fetchAllJournalDetails() {
  const ticketIds = [34987, 34679, 35118, 35458, 35838, 36641, 36431, 35460, 36301];

  for (const id of ticketIds) {
    try {
      const data = await get(`/issues/${id}.json`, { include: 'journals' });
      const issue = data.issue;
      console.log(`\n==================================================`);
      console.log(`TICKET #${issue.id}: ${issue.subject}`);
      console.log(`Proyecto: ${issue.project?.name} | Estado: ${issue.status?.name} | Asignado: ${issue.assigned_to?.name}`);
      console.log(`Descripción: ${issue.description || '(sin descripción)'}`);
      console.log(`---------------- Historial de Comentarios ----------------`);
      (issue.journals || []).forEach((j, i) => {
        if (j.notes && j.notes.trim()) {
          console.log(`[${j.created_on}] ${j.user?.name}:`);
          console.log(j.notes.trim());
          console.log(`- - -`);
        }
      });
    } catch (e) {
      console.error(`Error en ticket #${id}:`, e.message);
    }
  }
}

fetchAllJournalDetails();
