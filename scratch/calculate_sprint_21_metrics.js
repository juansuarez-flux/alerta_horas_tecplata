import { get } from '../redmineClient.js';

async function main() {
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
    console.log(`Found ${sprintIssues.length} issues in Sprint 21.`);

    const detailedSprintIssues = [];
    for (const issue of sprintIssues) {
      const detail = await get(`/issues/${issue.id}.json`, { include: 'journals' });
      detailedSprintIssues.push(detail.issue);
    }

    // 2. Fetch all project issues for date range check
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

    const bugsCreatedDuringSprint = allProjectIssues.filter(issue => {
      const createdOn = new Date(issue.created_on);
      const isBug = issue.tracker?.id === 30 || issue.tracker?.name?.toLowerCase() === 'bug';
      return createdOn >= sprintStart && createdOn <= sprintEnd && isBug;
    });

    // 3. Status summary of Sprint 21 issues
    const statusCounts = {};
    const trackerCounts = {};
    const resolvedIssuesList = [];
    const unresolvedIssuesList = [];

    detailedSprintIssues.forEach(issue => {
      const statusName = issue.status?.name;
      statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;

      const trackerName = issue.tracker?.name;
      trackerCounts[trackerName] = (trackerCounts[trackerName] || 0) + 1;

      // Find resolution date (status changed to Resolved (id: 3))
      let resolvedDate = null;
      if (issue.status.id === 3) {
        const journals = issue.journals || [];
        const transition = [...journals].reverse().find(j => 
          j.details.some(d => d.property === 'attr' && d.name === 'status_id' && String(d.new_value) === '3')
        );
        if (transition) {
          resolvedDate = new Date(transition.created_on);
        } else {
          resolvedDate = issue.closed_on ? new Date(issue.closed_on) : new Date(issue.updated_on);
        }
        resolvedIssuesList.push({ issue, resolvedDate });
      } else {
        unresolvedIssuesList.push(issue);
      }
    });

    console.log('\n--- STATUS COUNTS ---');
    console.log(statusCounts);

    console.log('\n--- TRACKER COUNTS ---');
    console.log(trackerCounts);

    // 4. Calculations
    let totalLeadAll = 0, totalCycleCappedAll = 0, totalCycleRealAll = 0, countAll = 0;
    let totalLeadTasks = 0, totalCycleCappedTasks = 0, totalCycleRealTasks = 0, countTasks = 0;
    let totalLeadBugs = 0, totalCycleCappedBugs = 0, totalCycleRealBugs = 0, countBugs = 0;

    const resolvedDetails = [];

    resolvedIssuesList.forEach(({ issue, resolvedDate }) => {
      const c = new Date(issue.created_on);
      
      // Calculate start date
      let startedDate = null;
      const journals = issue.journals || [];
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
          startedDate = c;
        }
      }

      const lead = (resolvedDate - c) / (1000 * 60 * 60 * 24);
      const cycleStart = startedDate < sprintStart ? sprintStart : startedDate;
      const cycleCapped = (resolvedDate - cycleStart) / (1000 * 60 * 60 * 24);
      const cycleReal = (resolvedDate - startedDate) / (1000 * 60 * 60 * 24);

      resolvedDetails.push({
        id: issue.id,
        subject: issue.subject,
        tracker: issue.tracker?.name,
        created: issue.created_on,
        started: startedDate.toISOString(),
        resolved: resolvedDate.toISOString(),
        lead,
        cycleCapped,
        cycleReal
      });

      totalLeadAll += lead;
      totalCycleCappedAll += cycleCapped;
      totalCycleRealAll += cycleReal;
      countAll++;

      if (issue.tracker?.name?.toLowerCase() === 'bug') {
        totalLeadBugs += lead;
        totalCycleCappedBugs += cycleCapped;
        totalCycleRealBugs += cycleReal;
        countBugs++;
      } else {
        totalLeadTasks += lead;
        totalCycleCappedTasks += cycleCapped;
        totalCycleRealTasks += cycleReal;
        countTasks++;
      }
    });

    console.log('\n--- RESOLVED ISSUES DETAIL ---');
    resolvedDetails.forEach(d => {
      console.log(`Issue #${d.id} (${d.tracker}): ${d.subject}`);
      console.log(`  Lead: ${d.lead.toFixed(1)}d, CycleCapped: ${d.cycleCapped.toFixed(1)}d, CycleReal: ${d.cycleReal.toFixed(1)}d`);
    });

    console.log('\n--- CALCULATED METRICS ---');
    console.log(`Throughput (Tasks/Stories resolved): ${countTasks}`);
    console.log(`Throughput (Bugs resolved): ${countBugs}`);
    console.log(`Throughput (Total resolved): ${countAll}`);
    
    console.log('\nAverages for Tasks/Stories resolved (non-Bugs):');
    if (countTasks > 0) {
      console.log(`  Lead Time: ${(totalLeadTasks / countTasks).toFixed(1)} days`);
      console.log(`  Cycle Time Capped: ${(totalCycleCappedTasks / countTasks).toFixed(1)} days`);
      console.log(`  Cycle Time Real: ${(totalCycleRealTasks / countTasks).toFixed(1)} days`);
    } else {
      console.log('  No tasks resolved.');
    }

    console.log('\nAverages for Bugs resolved:');
    if (countBugs > 0) {
      console.log(`  Lead Time: ${(totalLeadBugs / countBugs).toFixed(1)} days`);
      console.log(`  Cycle Time Capped: ${(totalCycleCappedBugs / countBugs).toFixed(1)} days`);
      console.log(`  Cycle Time Real: ${(totalCycleRealBugs / countBugs).toFixed(1)} days`);
    } else {
      console.log('  No bugs resolved.');
    }

    console.log('\nAverages for All resolved items:');
    if (countAll > 0) {
      console.log(`  Lead Time: ${(totalLeadAll / countAll).toFixed(1)} days`);
      console.log(`  Cycle Time Capped: ${(totalCycleCappedAll / countAll).toFixed(1)} days`);
      console.log(`  Cycle Time Real: ${(totalCycleRealAll / countAll).toFixed(1)} days`);
    }

    console.log('\n--- BUGS GENERATED DURING SPRINT PERIOD ---');
    console.log(`Total Bugs Generated: ${bugsCreatedDuringSprint.length}`);
    bugsCreatedDuringSprint.forEach(issue => {
      console.log(`Issue #${issue.id}: ${issue.subject} (Status: ${issue.status?.name}, Created: ${issue.created_on})`);
    });

    console.log('\n--- UNRESOLVED ISSUES IN SPRINT ---');
    unresolvedIssuesList.forEach(issue => {
      console.log(`Issue #${issue.id}: ${issue.subject} (Tracker: ${issue.tracker?.name}, Status: ${issue.status?.name})`);
    });

  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

main();
