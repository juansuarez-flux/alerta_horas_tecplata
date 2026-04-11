/**
 * tools/planSprint.js
 * Tool: plan_sprint
 * Suggests which backlog issues to pull into the next sprint based on priority.
 */

import { get } from '../redmineClient.js';
import { resolveProjectData, getIssueSubjects } from './utils.js';

// Redmine default priority IDs (lower number = lower priority)
const PRIORITY_ORDER = {
  5: 1, // Immediate
  4: 2, // Urgent
  3: 3, // High
  2: 4, // Normal
  1: 5, // Low
};

export const definition = {
  name: 'plan_sprint',
  description:
    'Suggest issues from the backlog to include in the next sprint, ordered by priority.',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The project identifier (slug or numeric ID).',
      },
      max_issues: {
        type: 'number',
        description: 'Maximum number of issues to suggest (default: 10).',
      },
      max_hours: {
        type: 'number',
        description:
          'Maximum total estimated hours for the sprint capacity (optional).',
      },
    },
    required: ['project_id'],
  },
};

export async function handler({ project_id, max_issues = 10, max_hours }) {
  if (!project_id) throw new Error('project_id is required');

  const projectData = await resolveProjectData(project_id);
  const data = await get('/issues.json', {
    project_id: projectData.id,
    'sprint_id': '!*',
    limit: 100,
    status_id: 'open',
  });

  const issues = data.issues ?? [];

  // Sort by priority (highest first) then by creation date (oldest first)
  const sorted = [...issues].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority?.id] ?? 99;
    const pb = PRIORITY_ORDER[b.priority?.id] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_on) - new Date(b.created_on);
  });

  // Resolve parent subjects for sorted issues
  const parentIds = sorted.filter(i => i.parent?.id).map(i => i.parent.id);
  const parentSubjects = await getIssueSubjects(parentIds);

  let suggested = [];
  let totalHours = 0;

  for (const issue of sorted) {
    if (suggested.length >= max_issues) break;
    const hours = issue.estimated_hours ?? 0;

    if (max_hours !== undefined && totalHours + hours > max_hours) {
      continue;
    }

    suggested.push({
      id: issue.id,
      subject: issue.subject,
      priority: issue.priority?.name,
      priority_id: issue.priority?.id,
      estimated_hours: hours,
      tracker: issue.tracker?.name,
      assigned_to: issue.assigned_to?.name ?? null,
      parent: (issue.parent?.id && parentSubjects[issue.parent.id])
        ? { id: issue.parent.id, subject: parentSubjects[issue.parent.id] }
        : (issue.parent ?? null),
      created_on: issue.created_on,
    });

    totalHours += hours;
  }

  return {
    project_id: projectData.identifier,
    backlog_total: issues.length,
    suggested_count: suggested.length,
    suggested_total_hours: totalHours,
    capacity_limit_hours: max_hours ?? null,
    suggested_issues: suggested,
  };
}
