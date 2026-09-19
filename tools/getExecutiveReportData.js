import { get } from '../redmineClient.js';
import { resolveProjectData } from './utils.js';
import { handler as getTimeEntriesHandler } from './getTimeEntries.js';

export const definition = {
  name: 'get_executive_report_data',
  description: 'ALWAYS call this tool first whenever the user asks to generate, create, or update an executive summary report (.docx) for Redmine spent time or support projects. This tool extracts raw spent time, journals, and task metadata. After calling this tool, YOU (the AI client) MUST synthesize and professionalize the data into clean corporate language. CRITICAL REQUIREMENTS FOR AI SYNTHESIS: 1) In activities_breakdown[].description, write a concrete summary of real deliverables/tasks (e.g. "Validación EDI VERMAS, correcciones Report PDF Billing N4..."). NEVER use generic sentences like "Imputaciones registradas en...". 2) In members_breakdown[].focus, summarize the developer technical focus cleanly. 3) Immediately call compile_executive_report_docx to compile the final document.',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } }
        ],
        description: 'Single project identifier/ID or array of project identifiers/IDs to consolidate (e.g. "soporte-l3" or ["soporte-l3-tareas", "soporte-l3-riesgos"]).',
      },
      issue_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Optional array of specific issue IDs to filter time entries and report data.',
      },
      from: {
        type: 'string',
        description: 'Optional start date (YYYY-MM-DD).',
      },
      to: {
        type: 'string',
        description: 'Optional end date (YYYY-MM-DD).',
      },
    },
    required: ['project_id'],
  },
};

/**
 * Helper to categorize activity
 */
function categorizeActivity(activityName = '', comments = '') {
  const name = activityName.toLowerCase();
  const comm = comments.toLowerCase();

  if (name.includes('diag') || comm.includes('diag') || comm.includes('qa') || comm.includes('verific') || comm.includes('prueba')) {
    return 'Diagnóstico y Verificaciones';
  }
  if (name.includes('anal') || comm.includes('anal') || comm.includes('investig') || comm.includes('endpoint') || comm.includes('arquitect')) {
    return 'Análisis e Investigación';
  }
  if (name.includes('reun') || name.includes('monit') || comm.includes('reun') || comm.includes('alineac') || comm.includes('sync') || name.includes('other')) {
    return 'Monitoreo y Reuniones';
  }
  return 'Desarrollo y Soporte Técnico';
}

export async function handler(args) {
  const { project_id, issue_ids, from, to } = args;

  const rawProjectIds = Array.isArray(project_id) ? project_id : [project_id];

  // Resolve metadata for all target projects
  const resolvedProjects = await Promise.all(
    rawProjectIds.map(id => resolveProjectData(id))
  );

  const projectNames = resolvedProjects.map(p => p.name || p.identifier).filter(Boolean);
  const displayProjectName = projectNames.length > 1
    ? `Consolidado: ${projectNames.join(' / ')}`
    : (projectNames[0] || String(project_id));

  const displayProjectId = resolvedProjects.map(p => p.id || p.numericId || p.identifier).join(', ');

  // 1. Fetch time entries across ALL projects
  const allEntriesArrays = await Promise.all(
    resolvedProjects.map(async (p) => {
      try {
        const pId = p.id || p.numericId || p.identifier;
        const res = await getTimeEntriesHandler({ project_id: pId, from, to, limit: 500 });
        return res.time_entries || [];
      } catch (e) {
        console.error(`Error fetching time entries for project ${p.identifier || p.id}:`, e.message);
        return [];
      }
    })
  );

  let timeEntries = allEntriesArrays.flat();

  // Filter issue_ids if provided
  if (Array.isArray(issue_ids) && issue_ids.length > 0) {
    const issueSet = new Set(issue_ids);
    timeEntries = timeEntries.filter(e => e.issue_id && issueSet.has(e.issue_id));
  }

  if (timeEntries.length === 0) {
    return {
      status: 'warning',
      message: 'No se encontraron registros de tiempo ni estimaciones para los proyectos y filtros especificados.',
      data: { project_ids: rawProjectIds, issue_ids, from, to }
    };
  }

  // 2. Fetch issue details for context
  const uniqueIssueIds = [...new Set(timeEntries.map(e => e.issue_id).filter(Boolean))];
  const issueDetailsMap = new Map();

  await Promise.all(
    uniqueIssueIds.map(async (id) => {
      try {
        const detail = await get(`/issues/${id}.json`);
        if (detail.issue) {
          issueDetailsMap.set(id, detail.issue);
        }
      } catch (e) {
        // ignore missing issues
      }
    })
  );

  // 3. Process raw metrics
  let totalHours = 0;
  const activityHoursMap = new Map();
  const activityCommentsMap = new Map();
  const userMap = new Map();
  const issueTasksMap = new Map();

  for (const entry of timeEntries) {
    const hours = parseFloat(entry.hours || 0);
    totalHours += hours;

    const userName = entry.user_name || 'Desconocido';
    const issueId = entry.issue_id || 0;

    if (!userMap.has(userName)) {
      userMap.set(userName, { name: userName, hours: 0, count: 0, tracker_ids: new Set(), comments: [] });
    }
    const userObj = userMap.get(userName);
    userObj.hours += hours;
    userObj.count += 1;
    if (issueId) {
      userObj.tracker_ids.add(issueId);
    }
    if (entry.comments) {
      userObj.comments.push(entry.comments);
    }

    const activityName = entry.activity_name || '';
    const comments = entry.comments || '';
    const category = categorizeActivity(activityName, comments);

    if (!activityHoursMap.has(category)) {
      activityHoursMap.set(category, 0);
      activityCommentsMap.set(category, []);
    }
    activityHoursMap.set(category, activityHoursMap.get(category) + hours);
    if (comments) {
      activityCommentsMap.get(category).push(comments);
    }

    const issueInfo = issueDetailsMap.get(issueId);
    const rawSubject = entry.issue_subject || issueInfo?.subject || `Tarea #${issueId}`;
    const status = issueInfo?.status?.name || 'En Curso';
    const isBolsa = rawSubject.toLowerCase().includes('horas de soporte');
    const taskPrefix = isBolsa ? 'Tracker' : 'Tarea';
    const projName = issueInfo?.project?.name || displayProjectName;
    const projectTag = projName.toLowerCase().includes('requerimiento') ? 'Requerimientos' : (projName.toLowerCase().includes('tarea') ? 'Tareas' : projName);
    const fullTaskTitle = `${taskPrefix} #${issueId} – ${rawSubject} (${projectTag})`;

    if (!issueTasksMap.has(issueId)) {
      issueTasksMap.set(issueId, {
        tracker_id: issueId,
        title: fullTaskTitle,
        raw_subject: rawSubject,
        total_hours: 0,
        status: status,
        assigned_to: userName,
        authorsMap: new Map(),
        entries: [],
        raw_comments: []
      });
    }

    const taskObj = issueTasksMap.get(issueId);
    taskObj.total_hours += hours;
    if (userName) {
      taskObj.authorsMap.set(userName, (taskObj.authorsMap.get(userName) || 0) + hours);
    }
    if (comments) {
      taskObj.raw_comments.push(comments);
    }

    taskObj.entries.push({
      date: entry.spent_on || '',
      author: userName,
      activity: activityName || category,
      hours: hours,
      description: comments || rawSubject,
      source: entry.source || 'spent_time'
    });
  }

  // Determine primary author per task
  for (const taskObj of issueTasksMap.values()) {
    let maxAuthor = taskObj.assigned_to;
    let maxH = 0;
    for (const [author, h] of taskObj.authorsMap.entries()) {
      if (h > maxH) {
        maxH = h;
        maxAuthor = author;
      }
    }
    taskObj.assigned_to = maxAuthor;
  }

  const defaultCategories = [
    'Diagnóstico y Verificaciones',
    'Desarrollo y Soporte Técnico',
    'Análisis e Investigación',
    'Monitoreo y Reuniones'
  ];

  const activitiesBreakdown = [];
  for (const cat of defaultCategories) {
    const h = activityHoursMap.get(cat) || 0;
    if (h > 0) {
      activitiesBreakdown.push({
        name: cat,
        hours: h,
        percent: (h / totalHours) * 100,
        raw_comments: activityCommentsMap.get(cat) || []
      });
    }
  }

  const membersBreakdown = Array.from(userMap.values()).map(u => {
    const trackerIdsArr = Array.from(u.tracker_ids);
    let trackerLabel = '';
    if (trackerIdsArr.length === 0) {
      trackerLabel = 'N/A';
    } else if (trackerIdsArr.length === 1) {
      trackerLabel = `Tarea #${trackerIdsArr[0]}`;
    } else {
      trackerLabel = `${trackerIdsArr.length} Tareas (#${trackerIdsArr.join(', #')})`;
    }

    return {
      name: u.name,
      tracker_id: trackerIdsArr[0] || 0,
      tracker_ids: trackerIdsArr,
      tracker_label: trackerLabel,
      hours: u.hours,
      percent: (u.hours / totalHours) * 100,
      raw_comments: u.comments
    };
  });

  return {
    status: 'success',
    instructions_for_ai: 'Instrucciones para el Cliente IA: Utiliza esta información estructurada para sintetizar y redactar los resúmenes ejecutivos profesionales en lenguaje corporativo (reemplaza jergas e informalidades). Luego, envía el objeto estructurado a la herramienta compile_executive_report_docx para generar el documento Word final.',
    project_name: displayProjectName,
    project_id: displayProjectId,
    period_str: `${from || 'Inicio'} a ${to || 'Actualidad'}`,
    date_emission: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    total_hours: totalHours,
    total_entries: timeEntries.length,
    professionals_count: membersBreakdown.length,
    tasks_count: issueTasksMap.size,
    members_breakdown: membersBreakdown,
    activities_breakdown: activitiesBreakdown,
    trackers_details: Array.from(issueTasksMap.values())
  };
}
