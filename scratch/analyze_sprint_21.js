import { get } from '../redmineClient.js';

async function analyzeSprint21() {
  const sprintId = 362;
  const projectId = 'rig-website-redesign-tareas1';
  const sprintStart = new Date('2026-07-06T00:00:00Z');
  const sprintEnd = new Date('2026-07-18T23:59:59Z');

  try {
    // 1. Fetch Sprint 21 issues
    console.log('Fetching Sprint 21 issues...');
    const sprintIssuesData = await get('/issues.json', {
      project_id: projectId,
      'f[]': ['agile_sprints', 'status_id'],
      'op[agile_sprints]': '=',
      'v[agile_sprints][]': [sprintId],
      'op[status_id]': '*',
      limit: 100,
    });

    const sprintIssues = sprintIssuesData.issues || [];
    console.log(`Found ${sprintIssues.length} issues associated with Sprint 21.`);

    const detailedSprintIssues = [];
    for (const issue of sprintIssues) {
      const detail = await get(`/issues/${issue.id}.json`, { include: 'journals' });
      detailedSprintIssues.push(detail.issue);
    }

    // 2. Fetch all project issues to find those created during Sprint 21
    console.log('Fetching all project issues for date range check...');
    const allProjectIssuesData = await get('/issues.json', {
      project_id: projectId,
      status_id: '*',
      limit: 100,
    });
    
    let allProjectIssues = allProjectIssuesData.issues || [];
    let offset = 100;
    while (allProjectIssuesData.total_count > allProjectIssues.length) {
      const more = await get('/issues.json', {
        project_id: projectId,
        status_id: '*',
        limit: 100,
        offset,
      });
      if (!more.issues || more.issues.length === 0) break;
      allProjectIssues = allProjectIssues.concat(more.issues);
      offset += 100;
    }
    console.log(`Fetched ${allProjectIssues.length} total issues for the project.`);

    // Filter issues created during Sprint 21 period
    const issuesCreatedDuringSprint = allProjectIssues.filter(issue => {
      const createdOn = new Date(issue.created_on);
      return createdOn >= sprintStart && createdOn <= sprintEnd;
    });

    // 3. Output results
    console.log('\n--- DETAILED SPRINT 21 ISSUES ---');
    detailedSprintIssues.forEach(issue => {
      const journals = issue.journals || [];
      
      // Find resolution date (when status changed to Resolved (id: 3))
      let resolvedDate = null;
      if (issue.status.id === 3) {
        const transition = [...journals].reverse().find(j => 
          j.details.some(d => d.property === 'attr' && d.name === 'status_id' && String(d.new_value) === '3')
        );
        if (transition) {
          resolvedDate = new Date(transition.created_on);
        } else {
          resolvedDate = issue.closed_on ? new Date(issue.closed_on) : new Date(issue.updated_on);
        }
      }

      // Find start date (when status changed to In Progress (id: 2) or In Dev (id: 4), etc.)
      let startedDate = null;
      const startTransition = journals.find(j => 
        j.details.some(d => d.property === 'attr' && d.name === 'status_id' && (String(d.new_value) === '2' || String(d.new_value) === '4'))
      );
      if (startTransition) {
        startedDate = new Date(startTransition.created_on);
      } else {
        const anyTransition = journals.find(j => 
          j.details.some(d => d.property === 'attr' && d.name === 'status_id')
        );
        if (anyTransition) {
          startedDate = new Date(anyTransition.created_on);
        } else {
          startedDate = new Date(issue.created_on);
        }
      }

      console.log(`Issue #${issue.id}: ${issue.subject}`);
      console.log(`  Tracker: ${issue.tracker?.name} (${issue.tracker?.id})`);
      console.log(`  Status: ${issue.status?.name} (${issue.status?.id})`);
      console.log(`  Created: ${issue.created_on}`);
      console.log(`  Started (Calculated): ${startedDate ? startedDate.toISOString() : 'N/A'}`);
      console.log(`  Resolved (Calculated): ${resolvedDate ? resolvedDate.toISOString() : 'N/A'}`);
    });

    console.log('\n--- ISSUES CREATED DURING SPRINT PERIOD (2026-07-06 to 2026-07-18) ---');
    issuesCreatedDuringSprint.forEach(issue => {
      console.log(`Issue #${issue.id}: ${issue.subject}`);
      console.log(`  Tracker: ${issue.tracker?.name} (${issue.tracker?.id})`);
      console.log(`  Status: ${issue.status?.name} (${issue.status?.id})`);
      console.log(`  Created: ${issue.created_on}`);
    });

  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

analyzeSprint21();
