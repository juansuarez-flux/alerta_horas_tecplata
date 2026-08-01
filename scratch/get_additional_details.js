import { get } from '../redmineClient.js';

async function getAdditionalDetails() {
  const ids = [37606, 37506, 37536];
  try {
    for (const id of ids) {
      console.log(`\n========================================`);
      console.log(`Fetching details for issue #${id}...`);
      const response = await get(`/issues/${id}.json`, { include: 'relations' });
      if (response && response.issue) {
        const issue = response.issue;
        console.log(`ID: #${issue.id}`);
        console.log(`Subject: ${issue.subject}`);
        console.log(`Tracker: ${issue.tracker?.name}`);
        console.log(`Status: ${issue.status?.name}`);
        console.log(`Priority: ${issue.priority?.name}`);
        console.log(`Assigned to: ${issue.assigned_to?.name || 'Unassigned'}`);
        console.log(`Target Version / Sprint: ${issue.fixed_version?.name || 'None'}`);
        console.log(`Created: ${issue.created_on}`);
        console.log(`Updated: ${issue.updated_on}`);
        console.log(`Description:`);
        console.log(issue.description || '(No description)');
      }
    }
  } catch (error) {
    console.error('Error fetching additional details:', error);
  }
}

getAdditionalDetails();
