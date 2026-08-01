import { get } from '../redmineClient.js';

async function fetchAbrilTickets() {
  const ids = [36946, 36431, 36301];
  for (const id of ids) {
    try {
      const data = await get(`/issues/${id}.json`, { include: 'journals' });
      const issue = data.issue;
      console.log(`\n==================================================`);
      console.log(`TICKET #${issue.id}: ${issue.subject}`);
      console.log(`Proyecto: ${issue.project?.name} | Estado: ${issue.status?.name} | Asignado: ${issue.assigned_to?.name}`);
      console.log(`Descripción: ${issue.description || '(sin descripción)'}`);
      console.log(`---------------- Historial de Comentarios ----------------`);
      (issue.journals || []).forEach((j) => {
        if (j.notes && j.notes.trim()) {
          console.log(`[${j.created_on}] ${j.user?.name}: ${j.notes.trim().substring(0, 300)}...`);
        }
      });
    } catch (e) {
      console.error(`Error fetching #${id}:`, e.message);
    }
  }
}

fetchAbrilTickets();
