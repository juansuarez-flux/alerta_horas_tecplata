/**
 * tools/sprintHealth.js
 * Tool: sprint_health
 * Analyzes sprint risk factors and returns a health score + risks list.
 */

import { get } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

export const definition = {
  name: 'sprint_health',
  description:
    'Analyze the health of a sprint: detect unassigned issues, blockers, estimation gaps, and too many pending items.',
  inputSchema: {
    type: 'object',
    properties: {
      sprint_id: {
        type: ['number', 'string'],
        description: 'The numeric ID or name of the sprint.',
      },
      project_id: {
        type: 'string',
        description: 'Project ID where the sprint is located (needed if passing name).',
      },
      todo_status_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Status IDs to treat as "todo" (default: [1]).',
      },
      blocked_status_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Status IDs to treat as "blocked" (default: []).',
      },
      todo_threshold_pct: {
        type: 'number',
        description:
          'Max acceptable % of issues in "todo" before flagging (default: 60).',
      },
    },
    required: ['sprint_id'],
  },
};

export async function handler({
  sprint_id,
  project_id,
  todo_status_ids = [1],
  blocked_status_ids = [],
  todo_threshold_pct = 60,
}) {
  if (!sprint_id) throw new Error('sprint_id is required');

  const projectData = await resolveProjectData(project_id);
  const resolved_sprint_id = await resolveSprintId(sprint_id, projectData.identifier);

  const data = await get('/issues.json', {
    project_id: projectData.id,
    'f[]': ['agile_sprints', 'status_id'],
    'op[agile_sprints]': '=',
    'v[agile_sprints][]': [resolved_sprint_id],
    'op[status_id]': '*',
    limit: 100,
  });

  const issues = data.issues ?? [];
  const total = issues.length;
  const risks = [];
  let penalty = 0;

  if (total === 0) {
    return {
      sprint_id,
      health_score: 100,
      risks: ['Sprint has no issues - possibly empty sprint.'],
      total_issues: 0,
    };
  }

  // --- Check 1: Unassigned issues ---
  const unassigned = issues.filter((i) => !i.assigned_to);
  if (unassigned.length > 0) {
    const pct = Math.round((unassigned.length / total) * 100);
    risks.push(
      `${unassigned.length} issue(s) (${pct}%) are not assigned to any team member.`
    );
    penalty += Math.min(30, pct);
  }

  // --- Check 2: Blocked issues ---
  if (blocked_status_ids.length > 0) {
    const blocked = issues.filter((i) =>
      blocked_status_ids.includes(i.status?.id)
    );
    if (blocked.length > 0) {
      risks.push(
        `${blocked.length} issue(s) are blocked: ${blocked
          .map((i) => `#${i.id} "${i.subject}"`)
          .join(', ')}.`
      );
      penalty += blocked.length * 10;
    }
  }

  // --- Check 3: Too many in "todo" ---
  const todoIssues = issues.filter((i) =>
    todo_status_ids.includes(i.status?.id)
  );
  const todoPct = Math.round((todoIssues.length / total) * 100);
  if (todoPct > todo_threshold_pct) {
    risks.push(
      `${todoPct}% of issues are still in "todo" (threshold: ${todo_threshold_pct}%), sprint may not complete on time.`
    );
    penalty += Math.min(25, todoPct - todo_threshold_pct);
  }

  // --- Check 4: Issues without estimation ---
  const noEstimate = issues.filter(
    (i) => !i.estimated_hours || i.estimated_hours === 0
  );
  if (noEstimate.length > 0) {
    const pct = Math.round((noEstimate.length / total) * 100);
    risks.push(
      `${noEstimate.length} issue(s) (${pct}%) have no time estimation.`
    );
    penalty += Math.min(15, pct / 4);
  }

  const health_score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    sprint_id: resolved_sprint_id,
    health_score,
    total_issues: total,
    unassigned_count: unassigned.length,
    no_estimate_count: noEstimate.length,
    todo_percentage: todoPct,
    risks,
  };
}
