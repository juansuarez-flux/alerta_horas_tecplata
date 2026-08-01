import { get } from '../redmineClient.js';

async function fetchAllTimeEntries(projectId) {
  let allEntries = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const data = await get('/time_entries.json', {
      project_id: projectId,
      from: '2025-01-01',
      to: '2026-12-31',
      limit: limit,
      offset: offset
    });
    
    const entries = data.time_entries || [];
    allEntries = allEntries.concat(entries);
    
    if (allEntries.length >= data.total_count || entries.length < limit) {
      break;
    }
    offset += limit;
  }
  return allEntries;
}

async function main() {
  try {
    const projects = [468, 469, 478];
    let allTimeEntries = [];
    
    for (const pid of projects) {
      try {
        const entries = await fetchAllTimeEntries(pid);
        console.log(`Fetched ${entries.length} entries for project ${pid}`);
        allTimeEntries = allTimeEntries.concat(entries);
      } catch (err) {
        console.error(`Error fetching project ${pid}:`, err.message);
      }
    }
    
    console.log(`Total entries across all successful projects: ${allTimeEntries.length}`);
    
    // Aggregate by Year-Month
    const report = {};
    
    for (const entry of allTimeEntries) {
      const date = entry.spent_on; // YYYY-MM-DD
      const month = date.substring(0, 7); // YYYY-MM
      const user = entry.user.name;
      const hours = entry.hours;
      const projName = entry.project.name;
      const activity = entry.activity ? entry.activity.name : 'N/A';
      
      if (!report[month]) {
        report[month] = {
          totalHours: 0,
          byProject: {},
          byUser: {},
          details: []
        };
      }
      
      report[month].totalHours += hours;
      
      if (!report[month].byProject[projName]) {
        report[month].byProject[projName] = 0;
      }
      report[month].byProject[projName] += hours;
      
      if (!report[month].byUser[user]) {
        report[month].byUser[user] = 0;
      }
      report[month].byUser[user] += hours;
      
      report[month].details.push({
        date,
        user,
        hours,
        project: projName,
        comments: entry.comments,
        activity,
        issueId: entry.issue ? entry.issue.id : null
      });
    }
    
    console.log('AGGREGATION_RESULT_START');
    console.log(JSON.stringify(report, null, 2));
    console.log('AGGREGATION_RESULT_END');
    
  } catch (error) {
    console.error('General Error:', error.message);
  }
}

main();
