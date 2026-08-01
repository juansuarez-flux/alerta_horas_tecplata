const resolvedIssues = [
  {
    id: 37831,
    tracker: "Bug",
    created: "2026-05-20T12:40:28Z",
    started: "2026-05-20T13:55:36.000Z",
    resolved: "2026-05-31T22:14:18.000Z"
  },
  {
    id: 37765,
    tracker: "Bug",
    created: "2026-05-18T15:12:53Z",
    started: "2026-05-18T15:51:20.000Z",
    resolved: "2026-05-21T13:45:55.000Z"
  },
  {
    id: 37606,
    tracker: "Bug",
    created: "2026-05-08T12:24:00Z",
    started: "2026-05-08T12:28:42.000Z",
    resolved: "2026-05-31T22:17:01.000Z"
  },
  {
    id: 37542,
    tracker: "Bug",
    created: "2026-05-05T19:35:56Z",
    started: "2026-05-06T12:38:30.000Z",
    resolved: "2026-05-31T22:25:12.000Z"
  },
  {
    id: 37536,
    tracker: "Bug",
    created: "2026-05-05T14:38:57Z",
    started: "2026-05-05T15:17:29.000Z",
    resolved: "2026-05-31T22:23:05.000Z"
  },
  {
    id: 37508,
    tracker: "Bug",
    created: "2026-05-04T19:02:56Z",
    started: "2026-05-05T12:34:32.000Z",
    resolved: "2026-05-31T22:15:39.000Z"
  },
  {
    id: 37506,
    tracker: "Bug",
    created: "2026-05-04T18:49:04Z",
    started: "2026-05-05T12:31:21.000Z",
    resolved: "2026-05-31T22:24:32.000Z"
  },
  {
    id: 37266,
    tracker: "UserStory",
    created: "2026-04-27T16:24:26Z",
    started: "2026-05-05T13:50:29.000Z",
    resolved: "2026-05-31T21:35:24.000Z"
  },
  {
    id: 37218,
    tracker: "UserStory",
    created: "2026-04-22T11:56:32Z",
    started: "2026-05-05T13:50:25.000Z",
    resolved: "2026-05-29T12:17:03.000Z"
  },
  {
    id: 37216,
    tracker: "UserStory",
    created: "2026-04-22T11:49:42Z",
    started: "2026-05-05T13:50:32.000Z",
    resolved: "2026-05-31T21:39:21.000Z"
  },
  {
    id: 37183,
    tracker: "Bug",
    created: "2026-04-17T16:12:18Z",
    started: "2026-04-21T13:50:29.000Z",
    resolved: "2026-05-31T22:24:01.000Z"
  },
  {
    id: 37148,
    tracker: "Bug",
    created: "2026-04-16T19:22:38Z",
    started: "2026-04-24T13:33:12.000Z",
    resolved: "2026-05-31T22:19:59.000Z"
  },
  {
    id: 37096,
    tracker: "Task",
    created: "2026-04-10T13:39:59Z",
    started: "2026-04-10T13:40:10.000Z",
    resolved: "2026-05-31T22:13:11.000Z"
  },
  {
    id: 36951,
    tracker: "UserStory",
    created: "2026-03-20T11:58:51Z",
    started: "2026-03-30T13:36:45.000Z",
    resolved: "2026-05-29T12:22:23.000Z"
  },
  {
    id: 36950,
    tracker: "UserStory",
    created: "2026-03-20T11:52:58Z",
    started: "2026-03-30T13:36:59.000Z",
    resolved: "2026-05-29T18:13:24.000Z"
  },
  {
    id: 36949,
    tracker: "UserStory",
    created: "2026-03-20T11:47:08Z",
    started: "2026-03-30T13:56:51.000Z",
    resolved: "2026-05-29T12:23:09.000Z"
  },
  {
    id: 36948,
    tracker: "UserStory",
    created: "2026-03-20T11:44:15Z",
    started: "2026-03-30T13:56:53.000Z",
    resolved: "2026-05-29T18:13:53.000Z"
  }
];

const sprintStart = new Date("2026-05-18T00:00:00Z");

function calculateCappedCycleTime(list) {
  let totalLead = 0;
  let totalCycleCapped = 0;
  let totalCycleReal = 0;

  list.forEach(issue => {
    const c = new Date(issue.created);
    const s = new Date(issue.started);
    const r = new Date(issue.resolved);

    const lead = (r - c) / (1000 * 60 * 60 * 24);
    
    // Capped cycle time: if issue started before sprint start, count execution from sprint start
    const cycleStart = s < sprintStart ? sprintStart : s;
    const cycleCapped = (r - cycleStart) / (1000 * 60 * 60 * 24);
    const cycleReal = (r - s) / (1000 * 60 * 60 * 24);

    totalLead += lead;
    totalCycleCapped += cycleCapped;
    totalCycleReal += cycleReal;

    console.log(`Issue #${issue.id} (${issue.tracker}): Lead=${lead.toFixed(1)}d, CycleCapped=${cycleCapped.toFixed(1)}d, CycleReal=${cycleReal.toFixed(1)}d`);
  });

  console.log(`\nAverages (Count: ${list.length}):`);
  console.log(`Lead Time (Promedio): ${(totalLead / list.length).toFixed(1)} days`);
  console.log(`Cycle Time Capped (Promedio): ${(totalCycleCapped / list.length).toFixed(1)} days`);
  console.log(`Cycle Time Real (Promedio): ${(totalCycleReal / list.length).toFixed(1)} days`);
}

console.log('--- ALL RESOLVED ISSUES ---');
calculateCappedCycleTime(resolvedIssues);

console.log('\n--- ONLY TASKS RESOLVED (UserStories + Tasks) ---');
calculateCappedCycleTime(resolvedIssues.filter(i => i.tracker !== 'Bug'));
