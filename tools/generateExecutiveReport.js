import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { get } from '../redmineClient.js';
import { resolveProjectData } from './utils.js';
import { handler as getTimeEntriesHandler } from './getTimeEntries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export const definition = {
  name: 'generate_executive_report',
  description: 'Generates a single consolidated executive summary Word report (.docx) with transparent activity pie chart for one or multiple Redmine projects.',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } }
        ],
        description: 'Single project identifier/ID or array of project identifiers/IDs to consolidate into one report (e.g. "soporte-l3" or ["soporte-l3-tareas", "soporte-l3-riesgos"]).',
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
      title: {
        type: 'string',
        description: 'Report main title (e.g. "INFORME EJECUTIVO DE ACTIVIDADES").',
      },
      subtitle: {
        type: 'string',
        description: 'Report subtitle (e.g. "Servicio de Soporte L3 - Agosto 2026").',
      },
      period_label: {
        type: 'string',
        description: 'Period label to show in executive metrics (e.g. "Agosto 2026").',
      },
      output_filename: {
        type: 'string',
        description: 'Filename or full output path for the .docx report (e.g. "Resumen_Ejecutivo_Agosto_2026.docx").',
      },
    },
    required: ['project_id'],
  },
};

/**
 * Categorize time entry activity into executive categories
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

/**
 * Clean and summarize comments for executive descriptions
 */
function summarizeComments(commentsArray, fallbackSubject = '') {
  const cleanList = commentsArray
    .map(c => (c || '').replace(/\[Estimated Time\][^\n]*/gi, '').trim())
    .filter(c => c.length > 3);

  const uniqueList = [...new Set(cleanList)];

  if (uniqueList.length > 0) {
    // Return comma separated clean items
    return uniqueList.slice(0, 4).join(', ');
  }

  return fallbackSubject || 'Actividades de soporte técnico y desarrollo.';
}

/**
 * Resolves safe default output directory for generated reports
 */
function resolveOutputDir() {
  if (process.env.REPORTS_OUTPUT_DIR) {
    const customDir = path.resolve(process.env.REPORTS_OUTPUT_DIR);
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true });
    }
    return customDir;
  }

  const userDownloads = path.join(os.homedir(), 'Downloads');
  if (fs.existsSync(userDownloads)) {
    return userDownloads;
  }

  return os.tmpdir();
}

export async function handler(args) {
  const { project_id, issue_ids, from, to, title, subtitle, period_label, output_filename } = args;

  // Normalize project_id parameter to array
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

  // 1. Fetch time entries across ALL projects in parallel
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

  // 2. Fetch issue subjects & details for context
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
        // ignore errors for missing issues
      }
    })
  );

  // 3. Process metrics across all projects and sources
  let totalHours = 0;
  const activityHoursMap = new Map();
  const activityCommentsMap = new Map();
  const userMap = new Map();
  const issueTasksMap = new Map();

  for (const entry of timeEntries) {
    const hours = parseFloat(entry.hours || 0);
    totalHours += hours;

    // User aggregation
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

    // Category aggregation
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

    // Issue/Task aggregation
    const issueInfo = issueDetailsMap.get(issueId);
    const rawSubject = entry.issue_subject || issueInfo?.subject || `Tarea #${issueId}`;
    const status = issueInfo?.status?.name || 'En Curso';

    const isBolsa = rawSubject.toLowerCase().includes('horas de soporte');
    const taskPrefix = isBolsa ? 'Tracker' : 'Tarea';
    const projName = issueInfo?.project?.name || project.name;
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
        comments: [],
        subtotal_label: `SUBTOTAL #${issueId}`,
        subtotal_desc: rawSubject
      });
    }

    const taskObj = issueTasksMap.get(issueId);
    taskObj.total_hours += hours;
    if (userName) {
      taskObj.authorsMap.set(userName, (taskObj.authorsMap.get(userName) || 0) + hours);
    }
    if (comments) {
      taskObj.comments.push(comments);
    }

    // Format clean entry description
    let entryDescription = comments || rawSubject;
    if (entry.source === 'estimated_hours') {
      entryDescription = `${comments}`;
    }

    taskObj.entries.push({
      date: entry.spent_on || '',
      author: userName,
      activity: activityName || category,
      hours: hours,
      description: entryDescription
    });
  }

  // Finalize task titles and subtotal_desc with primary author
  for (const taskObj of issueTasksMap.values()) {
    // Determine author with maximum hours logged on this task
    let maxAuthor = taskObj.assigned_to;
    let maxH = 0;
    for (const [author, h] of taskObj.authorsMap.entries()) {
      if (h > maxH) {
        maxH = h;
        maxAuthor = author;
      }
    }
    taskObj.assigned_to = maxAuthor;

    const summary = summarizeComments(taskObj.comments, taskObj.raw_subject);
    taskObj.subtotal_desc = summary;
  }

  // Format Members Breakdown expected by build_report.js
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

    const userFocusSummary = summarizeComments(u.comments, `Soporte técnico y tareas asociadas (${u.count} registros)`);

    return {
      name: u.name,
      tracker_id: trackerIdsArr[0] || 0,
      tracker_ids: trackerIdsArr,
      tracker_label: trackerLabel,
      hours: u.hours,
      percent: (u.hours / totalHours) * 100,
      focus: userFocusSummary
    };
  });

  // Format Activity Breakdown expected by build_report.js
  const defaultCategories = [
    'Diagnóstico y Verificaciones',
    'Desarrollo y Soporte Técnico',
    'Análisis e Investigación',
    'Monitoreo y Reuniones'
  ];

  const chartLabels = [];
  const chartHours = [];
  const activitiesBreakdown = [];

  // Build clean summary for Desarrollo category using task subjects if comments are sparse
  const devTasksSubjects = Array.from(issueTasksMap.values())
    .map(t => t.raw_subject)
    .filter(s => !s.toLowerCase().includes('horas de soporte'));

  for (const cat of defaultCategories) {
    const h = activityHoursMap.get(cat) || 0;
    if (h > 0) {
      chartLabels.push(cat);
      chartHours.push(h);
      const catComments = activityCommentsMap.get(cat) || [];
      let catSummary = summarizeComments(catComments, '');

      if (cat === 'Desarrollo y Soporte Técnico' && devTasksSubjects.length > 0) {
        const cleanedTasks = devTasksSubjects.slice(0, 3).join(', ');
        catSummary = catSummary
          ? `${cleanedTasks} (${catSummary})`
          : cleanedTasks;
      } else if (!catSummary) {
        catSummary = `Imputaciones de ${cat.toLowerCase()}`;
      }

      activitiesBreakdown.push({
        name: cat,
        hours: h,
        percent: (h / totalHours) * 100,
        description: catSummary
      });
    }
  }

  for (const [cat, h] of activityHoursMap.entries()) {
    if (!defaultCategories.includes(cat) && h > 0) {
      chartLabels.push(cat);
      chartHours.push(h);
      const catComments = activityCommentsMap.get(cat) || [];
      const catSummary = summarizeComments(catComments, `Imputaciones de ${cat.toLowerCase()}`);

      activitiesBreakdown.push({
        name: cat,
        hours: h,
        percent: (h / totalHours) * 100,
        description: catSummary
      });
    }
  }

  // 4. Resolve absolute paths independently of process.cwd()
  const skillDir = path.join(PROJECT_ROOT, '.agents', 'skills', 'redmine-executive-report');
  const pythonScript = path.join(skillDir, 'scripts', 'generate_chart.py');
  
  const tempDir = path.join(os.tmpdir(), 'mcp-redmine-reports');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = Date.now();
  const chartImgPath = path.join(tempDir, `chart_${timestamp}.png`);
  const reportJsonPath = path.join(tempDir, `report_data_${timestamp}.json`);

  const defaultDocName = `Resumen_Ejecutivo_Horas_Soporte_${timestamp}.docx`;
  let finalOutPath;

  if (output_filename) {
    const formattedName = output_filename.endsWith('.docx') ? output_filename : `${output_filename}.docx`;
    if (path.isAbsolute(formattedName)) {
      finalOutPath = formattedName;
    } else {
      finalOutPath = path.join(resolveOutputDir(), formattedName);
    }
  } else {
    finalOutPath = path.join(resolveOutputDir(), defaultDocName);
  }

  const outDir = path.dirname(finalOutPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (chartHours.length > 0 && fs.existsSync(pythonScript)) {
    try {
      const pythonCmd = `python "${pythonScript}" --hours "${chartHours.join(',')}" --labels "${chartLabels.join(',')}" --total ${totalHours} --output "${chartImgPath}"`;
      execSync(pythonCmd, { stdio: 'pipe' });
    } catch (chartErr) {
      console.error('Error generating python chart:', chartErr.message);
    }
  }

  // 5. Structure Report JSON data strictly matching build_report.js schema
  const formattedPeriodStr = period_label || `${from || 'Inicio'} a ${to || 'Actualidad'}`;
  const emissionDateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const reportData = {
    report_title: title || 'Resumen Ejecutivo: Reporte de Horas y Actividades de Soporte L3',
    project_name: displayProjectName,
    project_id: displayProjectId,
    period_str: formattedPeriodStr,
    date_emission: emissionDateStr,
    metrics: {
      total_hours: totalHours,
      trackers_count: issueTasksMap.size,
      trackers_label: `${issueTasksMap.size} Tareas evaluadas`,
      entries_count: timeEntries.length,
      members_count: membersBreakdown.length,
      members_label: `${membersBreakdown.length} integrantes`
    },
    purpose_items: [
      {
        title: 'Alcance del Informe Consolidado',
        description: `Se agrupan las actividades de los proyectos: ${displayProjectName}.`
      },
      {
        title: 'Monitoreo de Esfuerzo',
        description: 'Auditar el tiempo invertido y las imputaciones registradas en Redmine.'
      },
      {
        title: 'Transparencia Operativa',
        description: 'Presentar el desglose de actividades técnicas realizadas por el equipo.'
      }
    ],
    members_breakdown: membersBreakdown,
    chart_image_path: fs.existsSync(chartImgPath) ? chartImgPath : null,
    activities_breakdown: activitiesBreakdown,
    trackers_details: Array.from(issueTasksMap.values()),
    conclusions: [
      {
        title: 'Cumplimiento de Objetivos',
        text: `Se atendieron ${issueTasksMap.size} tareas clave consolidadas totalizando ${totalHours.toFixed(1)} horas de dedicación.`
      },
      {
        title: 'Continuidad Operativa',
        text: 'Las intervenciones garantizan la estabilidad del servicio y el cumplimiento de las metas técnicas establecidas.'
      }
    ]
  };

  fs.writeFileSync(reportJsonPath, JSON.stringify(reportData, null, 2), 'utf-8');

  // 6. Build .docx Document using build_report.js
  const buildReportScript = path.join(skillDir, 'scripts', 'build_report.js');
  try {
    const nodeCmd = `node "${buildReportScript}" "${reportJsonPath}" "${finalOutPath}"`;
    execSync(nodeCmd, { stdio: 'pipe' });
  } catch (buildErr) {
    throw new Error(`Error al construir el reporte Word: ${buildErr.message}`);
  }

  // Clean up intermediate temp files
  try {
    if (fs.existsSync(reportJsonPath)) fs.unlinkSync(reportJsonPath);
    if (fs.existsSync(chartImgPath)) fs.unlinkSync(chartImgPath);
  } catch {}

  return {
    status: 'success',
    message: 'Reporte ejecutivo consolidado generado con éxito.',
    report_file: finalOutPath,
    summary: {
      projects_consolidated: projectNames,
      total_hours: totalHours,
      total_entries: timeEntries.length,
      professionals_count: membersBreakdown.length,
      tasks_count: issueTasksMap.size,
      chart_generated: fs.existsSync(chartImgPath)
    }
  };
}
