
import { get } from '../redmineClient.js';

async function compareIssues() {
  try {
    const issue1 = await get('/issues/37215.json');
    const issue2 = await get('/issues/37218.json');

    console.log('ISSUE 37215:', JSON.stringify(issue1.issue, null, 2));
    console.log('\n-------------------\n');
    console.log('ISSUE 37218:', JSON.stringify(issue2.issue, null, 2));
  } catch (error) {
    console.error('Error fetching issues:', error.message);
  }
}

compareIssues();
