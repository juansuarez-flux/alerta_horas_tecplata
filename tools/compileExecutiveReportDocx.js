import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export const definition = {
  name: 'compile_executive_report_docx',
  description: 'Compiles and generates the final executive summary Word report (.docx) with transparent activity pie chart from structured report data prepared by the AI client.',
  inputSchema: {
    type: 'object',
    properties: {
      report_data: {
        type: 'object',
        description: 'The structured and synthesized report object (containing title, project_name, metrics, members_breakdown, activities_breakdown, trackers_details, conclusions).',
      },
      output_filename: {
        type: 'string',
        description: 'Filename or full output path for the .docx report (e.g. "Resumen_Ejecutivo_Agosto_2026.docx").',
      },
    },
    required: ['report_data'],
  },
};

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
  const { report_data, output_filename } = args;

  if (!report_data || typeof report_data !== 'object') {
    throw new Error('El argumento report_data es obligatorio y debe ser un objeto estructurado.');
  }

  const totalHours = parseFloat(report_data.metrics?.total_hours || report_data.total_hours || 0);

  // Extract chart data
  const chartLabels = [];
  const chartHours = [];

  const activities = report_data.activities_breakdown || [];
  for (const act of activities) {
    const h = parseFloat(act.hours || 0);
    if (h > 0) {
      chartLabels.push(act.name);
      chartHours.push(h);
    }
  }

  // Generate chart PNG via Python
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

  // Ensure chart_image_path is set in report_data if generated
  if (fs.existsSync(chartImgPath)) {
    report_data.chart_image_path = chartImgPath;
  }

  // Ensure default metrics payload exists if missing
  if (!report_data.metrics) {
    report_data.metrics = {
      total_hours: totalHours,
      trackers_count: (report_data.trackers_details || []).length,
      trackers_label: `${(report_data.trackers_details || []).length} Tareas evaluadas`,
      entries_count: report_data.total_entries || 0,
      members_count: (report_data.members_breakdown || []).length,
      members_label: `${(report_data.members_breakdown || []).length} integrantes`
    };
  }

  // Save report data JSON
  fs.writeFileSync(reportJsonPath, JSON.stringify(report_data, null, 2), 'utf-8');

  // Build .docx Document using build_report.js
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
    message: 'Reporte ejecutivo Word compilado con éxito.',
    report_file: finalOutPath,
    summary: {
      project_name: report_data.project_name,
      total_hours: totalHours,
      tasks_count: (report_data.trackers_details || []).length,
      chart_generated: fs.existsSync(chartImgPath)
    }
  };
}
