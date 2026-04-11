/**
 * tools/sprint_prediction.js
 * Tool: sprint_prediction
 * Estimates sprint velocity and predicts completion days remaining based on current progress.
 */

import { get } from '../redmineClient.js';
import { resolveSprintId, resolveProjectData } from './utils.js';

const COMPLETED_STATUS_IDS = [3, 5, 6];

export const definition = {
  name: 'sprint_prediction',
  description: 'Predict sprint completion time based on historical velocity within the current sprint.',
  inputSchema: {
    type: 'object',
    properties: {
      sprint_id: {
        type: ['number', 'string'],
        description: 'The numeric ID or name of the sprint.',
      },
      project_id: {
        type: 'string',
        description: 'The project identifier (slug or numeric ID) to fetch sprint dates.',
      },
    },
    // We require project_id to look up the sprint start/end dates from the Agile API
    required: ['sprint_id', 'project_id'],
  },
};

export async function handler({ sprint_id, project_id }) {
  if (!sprint_id) throw new Error('sprint_id is required');
  if (!project_id) throw new Error('project_id is required');

  const projectData = await resolveProjectData(project_id);
  const resolved_sprint_id = await resolveSprintId(sprint_id, projectData.identifier);

  // 1. Fetch sprint definition to get dates
  const sprintData = await get(`/projects/${projectData.identifier}/agile_sprints.json`);
  const sprints = sprintData.agile_sprints ?? sprintData.sprints ?? [];
  const activeSprint = sprints.find((s) => s.id === resolved_sprint_id);

  if (!activeSprint || !activeSprint.start_date || !activeSprint.end_date) {
    throw new Error(`Sprint ${resolved_sprint_id} not found or missing start/end dates.`);
  }

  const issueData = await get('/issues.json', {
    project_id: projectData.id,
    'f[]': ['agile_sprints', 'status_id'],
    'op[agile_sprints]': '=',
    'v[agile_sprints][]': [resolved_sprint_id],
    'op[status_id]': '*',
    limit: 100,
  });

  const issues = issueData.issues ?? [];

  // Calculate story points
  let totalPoints = 0;
  let completedPoints = 0;

  for (const issue of issues) {
    let points = issue.story_points ?? 0;
    if (!points && issue.custom_fields) {
      const spField = issue.custom_fields.find(
        (cf) => cf.name.toLowerCase().includes('story point')
      );
      if (spField && spField.value) {
        points = Number(spField.value) || 0;
      }
    }
    
    // Fallback: if no points system exists, count issues as 1 point each
    if (points === 0) points = 1;

    totalPoints += points;
    if (COMPLETED_STATUS_IDS.includes(issue.status?.id)) {
      completedPoints += points;
    }
  }

  const remainingPoints = totalPoints - completedPoints;

  // 3. Time calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(activeSprint.start_date);
  const endDate = new Date(activeSprint.end_date);
  
  // Calculate days elapsed (minimum 1 to avoid divide-by-zero)
  const msElapsed = today.getTime() - startDate.getTime();
  const daysElapsed = Math.max(1, Math.ceil(msElapsed / (1000 * 60 * 60 * 24)));
  
  // Calculate official remaining days in the sprint cycle
  const msRemainingSprint = endDate.getTime() - today.getTime();
  const daysRemainingSprint = Math.max(0, Math.ceil(msRemainingSprint / (1000 * 60 * 60 * 24)));

  // Velocity Calculation
  const velocityPerDay = Number((completedPoints / daysElapsed).toFixed(2));
  
  let predictedCompletionDays = 0;
  let riskLevel = 'medium';

  if (remainingPoints === 0) {
    predictedCompletionDays = 0;
    riskLevel = 'low'; // Done!
  } else if (velocityPerDay === 0) {
    predictedCompletionDays = 999;
    riskLevel = 'high'; // No progress made yet
  } else {
    predictedCompletionDays = Math.ceil(remainingPoints / velocityPerDay);
    
    if (predictedCompletionDays <= daysRemainingSprint) {
      riskLevel = 'low';
    } else if (predictedCompletionDays <= daysRemainingSprint + 2) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }
  }

  // Check edge case where sprint hasn't started yet
  if (today < startDate) {
    return {
      message: 'Sprint has not started yet. Prediction is unavailable.',
      velocity_per_day: 0,
      remaining_points: remainingPoints,
      predicted_completion_days: null,
      risk_level: 'low',
    };
  }

  return {
    sprint_id: resolved_sprint_id,
    velocity_per_day: velocityPerDay,
    total_points: totalPoints,
    completed_points: completedPoints,
    remaining_points: remainingPoints,
    predicted_completion_days: predictedCompletionDays,
    scheduled_days_remaining: daysRemainingSprint,
    risk_level: riskLevel,
  };
}
