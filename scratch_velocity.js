import { get } from './redmineClient.js';
import fs from 'fs';

async function run() {
  try {
    // get project statuses to find 'Reviewing' ID
    const statusesData = await get('/issue_statuses.json');
    const statuses = statusesData.issue_statuses;
    console.log('Statuses:', statuses.map(s => `${s.id}: ${s.name}`).join(', '));
    
    // get a sample issue with journals
    const issuesData = await get('/issues.json', { project_id: 'rig-website-redesign-tareas1', status_id: '*', limit: 2 });
    console.log('Got issues:', issuesData.issues.map(i => i.id));
    
    if (issuesData.issues.length > 0) {
      const issueId = issuesData.issues[0].id;
      const issueDetails = await get(`/issues/${issueId}.json`, { include: 'journals' });
      console.log('Journals for issue', issueId, 'count:', issueDetails.issue.journals?.length || 0);
      if (issueDetails.issue.journals?.length > 0) {
         console.log('Sample journal:', JSON.stringify(issueDetails.issue.journals[issueDetails.issue.journals.length - 1], null, 2));
      }
    }
    
    // Get sprint list
    const sprints = await get('/projects/rig-website-redesign-tareas1/agile_sprints.json');
    console.log('Found sprints:', sprints.agile_sprints?.length || sprints.sprints?.length);
  } catch(e) {
    console.error(e);
  }
}
run();
