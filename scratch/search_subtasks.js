import { get } from '../redmineClient.js';

async function searchSubtasks() {
  const parentId = 38281;
  try {
    console.log(`Fetching details for issue #${parentId}...`);
    const parentResponse = await get(`/issues/${parentId}.json`, { include: 'relations,children' });
    if (!parentResponse || !parentResponse.issue) {
      console.log(`Issue #${parentId} not found.`);
      return;
    }

    const parent = parentResponse.issue;
    console.log(`\n========================================`);
    console.log(`PARENT FEATURE:`);
    console.log(`ID: #${parent.id}`);
    console.log(`Subject: ${parent.subject}`);
    console.log(`Tracker: ${parent.tracker?.name}`);
    console.log(`Status: ${parent.status?.name}`);
    console.log(`Assigned to: ${parent.assigned_to?.name || 'Unassigned'}`);
    console.log(`Description:`);
    console.log(parent.description || '(No description)');
    console.log(`========================================\n`);

    // Fetch children from the issue details
    if (parent.children && parent.children.length > 0) {
      console.log(`Found ${parent.children.length} direct children in issue details:`);
      for (const child of parent.children) {
        const childDetails = await get(`/issues/${child.id}.json`);
        const c = childDetails.issue;
        console.log(`- [#${c.id}] [${c.tracker?.name || 'Issue'}] "${c.subject}" (${c.status?.name})`);
        if (c.assigned_to) {
          console.log(`  Assigned to: ${c.assigned_to.name}`);
        }
      }
    } else {
      console.log('No direct children found in the issue payload.');
      
      // Let's also query via issues.json with parent_id just in case
      console.log('Querying via /issues.json with parent_id...');
      const listResponse = await get('/issues.json', {
        parent_id: parentId,
        status_id: '*',
      });
      
      const issues = listResponse.issues || [];
      if (issues.length > 0) {
        console.log(`Found ${issues.length} children via query:`);
        issues.forEach(c => {
          console.log(`- [#${c.id}] [${c.tracker?.name || 'Issue'}] "${c.subject}" (${c.status?.name})`);
          if (c.assigned_to) {
            console.log(`  Assigned to: ${c.assigned_to.name}`);
          }
        });
      } else {
        console.log('No child issues found via API query either.');
      }
    }
  } catch (error) {
    console.error('Error fetching subtasks:', error);
  }
}

searchSubtasks();
