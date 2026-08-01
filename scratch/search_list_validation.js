import { get } from '../redmineClient.js';

async function searchIssues() {
  try {
    console.log('Fetching issues for project rig-website-redesign-tareas1...');
    let allIssues = [];
    let offset = 0;
    const limit = 100;
    let totalCount = 1;

    while (offset < totalCount) {
      const data = await get('/issues.json', {
        project_id: 'rig-website-redesign-tareas1',
        status_id: '*', // both open and closed
        limit,
        offset,
      });

      if (!data.issues) {
        break;
      }

      allIssues.push(...data.issues);
      totalCount = data.total_count || 0;
      offset += limit;
      console.log(`Fetched ${allIssues.length} / ${totalCount} issues...`);
    }

    console.log(`\nFinished fetching ${allIssues.length} issues. Filtering...`);

    // We want to find:
    // 1. Issues with "List Value Validation" or similar in their subject.
    // 2. Issues whose parent ID is 36947 (List Value Validation).
    // 3. Issues that mention 36947 in their subject or relationships.
    const queryTerm = 'list value validation';
    const featureId = 36947;

    const matchedIssues = allIssues.filter(issue => {
      const subject = (issue.subject || '').toLowerCase();
      const isDirectMatch = subject.includes(queryTerm);
      const isParentMatch = issue.parent && (issue.parent.id === featureId);
      
      // Let's also retrieve more details if possible, or check if there's any other indicator
      return isDirectMatch || isParentMatch;
    });

    console.log(`\nFound ${matchedIssues.length} matching issues:`);
    matchedIssues.forEach(issue => {
      console.log(`- [#${issue.id}] [${issue.tracker?.name || 'Issue'}] "${issue.subject}" (${issue.status?.name})`);
      if (issue.parent) {
        console.log(`  Parent: [#${issue.parent.id}] "${issue.parent.subject || ''}"`);
      }
      if (issue.assigned_to) {
        console.log(`  Assigned to: ${issue.assigned_to.name}`);
      }
    });

  } catch (error) {
    console.error('Error searching issues:', error);
  }
}

searchIssues();
