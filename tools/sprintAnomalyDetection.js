/**
 * tools/sprint_anomaly_detection.js
 * Tool: sprint_anomaly_detection
 * Detects specific anomalies in sprint issues (e.g. unassigned, extremely large estimated hours, etc.)
 */

import { get } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

export const definition = {
  name: 'sprint_anomaly_detection',
  description: 'Detect anomalies in a sprint (e.g., unassigned blocked issues, over-estimated issues).',
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
    },
    required: ['sprint_id'],
  },
};

export async function handler({ sprint_id, project_id }) {
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
  const anomalies = [];

  for (const issue of issues) {
    const isDone = [3, 5, 6].includes(issue.status?.id);
    
    // Anomaly 1: Unassigned issue that is NOT completed
    if (!issue.assigned_to && !isDone) {
      anomalies.push({
        type: 'UNASSIGNED',
        issue_id: issue.id,
        description: `Issue "${issue.subject}" is not assigned to anyone.`,
      });
    }

    // Anomaly 2: Missing estimation (hours AND story points) for a non-completed item
    let points = issue.story_points ?? 0;
    if (!points && issue.custom_fields) {
      const spField = issue.custom_fields.find((cf) => cf.name.toLowerCase().includes('story point'));
      if (spField && spField.value) points = Number(spField.value) || 0;
    }

    if (!isDone && (issue.estimated_hours == null || issue.estimated_hours === 0) && points === 0) {
      anomalies.push({
        type: 'MISSING_ESTIMATION',
        issue_id: issue.id,
        description: `Issue "${issue.subject}" has no estimated hours or story points.`,
      });
    }

    // Anomaly 3: Extremely large issue (> 40 hours) 
    if (issue.estimated_hours && issue.estimated_hours > 40) {
      anomalies.push({
        type: 'VERY_LARGE_ISSUE',
        issue_id: issue.id,
        description: `Issue "${issue.subject}" is estimated at ${issue.estimated_hours}h, which is very large. Consider breaking it down.`,
      });
    }

    // Anomaly 4: Blocked / Feedback status but no recent updates or unassigned
    // Assume 4 = Feedback, or any known blocked status
    if (issue.status?.id === 4) {
      anomalies.push({
        type: 'BLOCKED_FEEDBACK',
        issue_id: issue.id,
        description: `Issue "${issue.subject}" is locked in Feedback/Blocked state.`,
      });
    }
  }

  // Anomaly 5: Too many "To Do" items (status=1) relative to total
  const todoItems = issues.filter(i => i.status?.id === 1);
  if (issues.length > 0 && (todoItems.length / issues.length) > 0.7) {
     anomalies.push({
        type: 'BOTTLENECK',
        issue_id: null,
        description: `More than 70% of issues (${todoItems.length} items) are still in "To Do". Sprint has a severe bottleneck.`,
     });
  }

  return {
    sprint_id: resolved_sprint_id,
    anomaly_count: anomalies.length,
    anomalies,
  };
}
