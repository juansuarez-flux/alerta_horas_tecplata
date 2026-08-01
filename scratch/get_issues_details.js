import { get } from '../redmineClient.js';

async function getDetails() {
  const ids = [36947, 36948, 36949, 36950, 36951];
  try {
    for (const id of ids) {
      console.log(`\n========================================`);
      console.log(`Fetching details for issue #${id}...`);
      const response = await get(`/issues/${id}.json`, { include: 'relations,journals' });
      if (response && response.issue) {
        const issue = response.issue;
        console.log(`ID: #${issue.id}`);
        console.log(`Subject: ${issue.subject}`);
        console.log(`Tracker: ${issue.tracker?.name}`);
        console.log(`Status: ${issue.status?.name}`);
        console.log(`Priority: ${issue.priority?.name}`);
        console.log(`Assigned to: ${issue.assigned_to?.name || 'Unassigned'}`);
        console.log(`Target Version / Sprint: ${issue.fixed_version?.name || 'None'}`);
        if (issue.fixed_version) {
           console.log(`  Sprint/Version ID: ${issue.fixed_version.id}`);
        }
        console.log(`Created: ${issue.created_on}`);
        console.log(`Updated: ${issue.updated_on}`);
        console.log(`Description:`);
        console.log(issue.description || '(No description)');
        
        if (issue.relations && issue.relations.length > 0) {
          console.log(`Relations:`);
          issue.relations.forEach(r => {
            console.log(`  - Relation #${r.id}: ${r.relation_type} ${r.issue_id === id ? 'to #' + r.issue_to_id : 'from #' + r.issue_id}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching issue details:', error);
  }
}

getDetails();
