/**
 * tools/sprintSummary.js
 * Tool: sprint_summary
 * Aggregates sprint issues and groups them by status.
 */

import { get } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

// Status categories (configurable via common Redmine defaults)
const STATUS_CATEGORIES = {
  todo: [1],        // New
  doing: [2, 4],   // In Progress, Feedback
  done: [3, 5, 6], // Resolved, Closed, Rejected
};

export const definition = {
  name: 'sprint_summary',
  description:
    'Get a summary of a sprint: total issues and counts grouped by todo/doing/done.',
  inputSchema: {
    type: 'object',
    properties: {
      sprint_id: {
        type: ['number', 'string'],
        description: 'The numeric ID or name of the sprint.',
      },
      project_id: {
        type: 'string',
        description: 'Project ID where the sprint is located (optional, but needed if passing name).',
      },
      todo_status_ids: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Custom list of status IDs to count as "todo" (default: [1]).',
      },
      doing_status_ids: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Custom list of status IDs to count as "doing" (default: [2, 4]).',
      },
      done_status_ids: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Custom list of status IDs to count as "done" (default: [3, 5, 6]).',
      },
    },
    required: ['sprint_id'],
  },
};

export async function handler({
  sprint_id,
  project_id,
  todo_status_ids,
  doing_status_ids,
  done_status_ids,
}) {
  if (!sprint_id) throw new Error('sprint_id is required');

  const projectData = await resolveProjectData(project_id);
  const resolved_sprint_id = await resolveSprintId(sprint_id, projectData.identifier);

  const data = await get('/issues.json', {
    project_id: projectData.id,
    'f[]': ['agile_sprints', 'status_id'],
    'op[agile_sprints]': '=', // Redmine Agile filter fix: use '=' instead of '=='
    'v[agile_sprints][]': [resolved_sprint_id],
    'op[status_id]': '*',
    limit: 100,
  });

  const issues = data.issues ?? [];

  const todoIds = todo_status_ids ?? STATUS_CATEGORIES.todo;
  const doingIds = doing_status_ids ?? STATUS_CATEGORIES.doing;
  const doneIds = done_status_ids ?? STATUS_CATEGORIES.done;

  let todo = 0;
  let doing = 0;
  let done = 0;
  let other = 0;

  const byStatus = {};

  for (const issue of issues) {
    const sid = issue.status?.id;
    const sname = issue.status?.name ?? 'Unknown';
    byStatus[sname] = (byStatus[sname] || 0) + 1;

    if (todoIds.includes(sid)) todo++;
    else if (doingIds.includes(sid)) doing++;
    else if (doneIds.includes(sid)) done++;
    else other++;
  }

  const total = issues.length;
  const completion_pct =
    total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    sprint_id: resolved_sprint_id,
    total_issues: total,
    todo,
    doing,
    done,
    other,
    completion_percentage: completion_pct,
    by_status: byStatus,
  };
}
