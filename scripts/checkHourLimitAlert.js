/**
 * checkHourLimitAlert.js
 *
 * Suma el consumo de horas del mes en curso para la bolsa de Soporte L3
 * (proyectos "Requerimientos" + "Tareas") y envía un email de alerta con un
 * INFORME EJECUTIVO COMPLETO en formato HTML corporativo (fondo claro) al
 * cruzar los umbrales de 40hs y 45hs, sobre un límite acordado de 50hs.
 *
 * Pensado para correr diariamente vía GitHub Actions. El estado de qué
 * umbrales ya se alertaron en el mes se persiste en state/hour-alert-state.json.
 * Soporta la flag --force para ejecutar y enviar el correo bajo demanda.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { handler as getExecutiveReportData } from '../tools/getExecutiveReportData.js';

const PROJECTS = [
  'Soporte L3 2025-2026 - Requerimientos',
  'Soporte L3 2025-2026 - Tareas',
];
const THRESHOLDS = [40, 45];
const MONTHLY_LIMIT = 50;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, '..', 'state', 'hour-alert-state.json');

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatDateSpanish(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function monthRange(date = new Date()) {
  return {
    from: `${currentMonthKey(date)}-01`,
    to: date.toISOString().slice(0, 10),
  };
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

/**
 * Genera el cuerpo HTML corporativo del correo (Fondo claro, profesional)
 */
function buildHtmlReport(reportData, threshold, monthlyLimit = MONTHLY_LIMIT) {
  const {
    project_name,
    period_str,
    total_hours,
    total_entries,
    tasks_count,
    members_breakdown = [],
    activities_breakdown = [],
    trackers_details = [],
  } = reportData;

  const totalHsFormatted = total_hours.toFixed(1).replace('.', ',');

  // 1. Integrantes
  const membersRows = members_breakdown.map((m, idx) => {
    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F9FBFD';
    return `
      <tr style="background-color: ${bg}; font-size: 14px; color: #222222;">
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${m.name}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: center;">${m.hours.toFixed(1).replace('.', ',')} hs</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 600;">${m.percent.toFixed(1).replace('.', ',')}%</td>
      </tr>`;
  }).join('');

  // 2. Actividades
  const activitiesRows = activities_breakdown.map((act, idx) => {
    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F9FBFD';
    return `
      <tr style="background-color: ${bg}; font-size: 14px; color: #222222;">
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${act.name}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: center;">${act.hours.toFixed(1).replace('.', ',')} hs</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 600;">${act.percent.toFixed(1).replace('.', ',')}%</td>
      </tr>`;
  }).join('');

  // 3. Ítems destacados
  const itemsHighlights = trackers_details.map(t => {
    const hoursStr = `${t.total_hours.toFixed(1).replace('.', ',')} hs`;
    const statusText = t.status || 'En curso';
    const commentsList = (t.raw_comments || []).filter(c => c && c.trim().length > 3);
    const cleanComment = commentsList.length > 0 ? commentsList[0] : '';
    const noteSuffix = cleanComment ? `. ${cleanComment}` : '';

    return `
      <li style="margin-bottom: 10px; font-size: 14px; line-height: 1.5; color: #2D3748;">
        <strong>#${t.tracker_id} — ${t.raw_subject || t.title}</strong> (${hoursStr}) &rarr; 
        <em>Estado: ${statusText}</em>${noteSuffix}
      </li>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Ejecutivo - Soporte L3</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F4F7F9; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #E2E8F0; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Encabezado -->
    <div style="border-bottom: 2px solid #003366; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="margin: 0 0 6px 0; font-size: 22px; color: #003366; font-weight: 700;">Informe Ejecutivo — Soporte L3 TecPlata</h1>
      <p style="margin: 0; font-size: 14px; color: #4A5568;"><strong>Período:</strong> ${period_str}</p>
      ${threshold ? `<div style="margin-top: 10px; display: inline-block; background-color: #FFF5F5; border: 1px solid #FEB2B2; color: #C53030; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 600;">⚠️ Alerta de Consumo: Umbral de ${threshold}hs superado (${totalHsFormatted}hs / ${monthlyLimit}hs)</div>` : ''}
    </div>

    <!-- Métricas generales -->
    <h2 style="font-size: 16px; color: #003366; margin: 20px 0 10px 0; border-bottom: 1px solid #EDF2F7; padding-bottom: 4px;">Métricas generales</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
      <tbody>
        <tr style="background-color: #FFFFFF; font-size: 14px;">
          <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; color: #4A5568; font-weight: 600;">Horas totales</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; color: #003366; font-weight: 700; text-align: right; font-size: 16px;">${totalHsFormatted} hs</td>
        </tr>
        <tr style="background-color: #F9FBFD; font-size: 14px;">
          <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; color: #4A5568; font-weight: 600;">Ítems trabajados</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; color: #2D3748; font-weight: 700; text-align: right;">${tasks_count}</td>
        </tr>
        <tr style="background-color: #FFFFFF; font-size: 14px;">
          <td style="padding: 10px 16px; color: #4A5568; font-weight: 600;">Profesionales</td>
          <td style="padding: 10px 16px; color: #2D3748; font-weight: 700; text-align: right;">${members_breakdown.length}</td>
        </tr>
      </tbody>
    </table>

    <!-- Distribución por profesional -->
    <h2 style="font-size: 16px; color: #003366; margin: 24px 0 10px 0; border-bottom: 1px solid #EDF2F7; padding-bottom: 4px;">Distribución por profesional</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
      <thead>
        <tr style="background-color: #003366; color: #FFFFFF; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
          <th style="padding: 10px 14px; text-align: left;">Profesional</th>
          <th style="padding: 10px 14px; text-align: center;">Horas</th>
          <th style="padding: 10px 14px; text-align: center;">%</th>
        </tr>
      </thead>
      <tbody>
        ${membersRows}
      </tbody>
    </table>

    <!-- Distribución por actividad -->
    <h2 style="font-size: 16px; color: #003366; margin: 24px 0 10px 0; border-bottom: 1px solid #EDF2F7; padding-bottom: 4px;">Distribución por actividad</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
      <thead>
        <tr style="background-color: #003366; color: #FFFFFF; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
          <th style="padding: 10px 14px; text-align: left;">Actividad</th>
          <th style="padding: 10px 14px; text-align: center;">Horas</th>
          <th style="padding: 10px 14px; text-align: center;">%</th>
        </tr>
      </thead>
      <tbody>
        ${activitiesRows}
      </tbody>
    </table>

    <!-- Ítems destacados -->
    <h2 style="font-size: 16px; color: #003366; margin: 24px 0 10px 0; border-bottom: 1px solid #EDF2F7; padding-bottom: 4px;">Ítems destacados</h2>
    <ul style="padding-left: 20px; margin: 0 0 24px 0;">
      ${itemsHighlights}
    </ul>

    <!-- Pie de página -->
    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: right; font-size: 12px; color: #A0AEC0;">
      Reporte generado automáticamente por Redmine Agile MCP.
    </div>

  </div>
</body>
</html>
  `;
}

function buildTextFallback(reportData, threshold, monthlyLimit = MONTHLY_LIMIT) {
  const { period_str, total_hours, tasks_count, members_breakdown = [] } = reportData;
  const remaining = Math.max(0, monthlyLimit - total_hours).toFixed(1);

  return (
    `INFORME EJECUTIVO DE CONSUMO DE HORAS - SOPORTE L3\n` +
    `Período: ${period_str}\n\n` +
    `MÉTRICAS GENERALES:\n` +
    `- Horas Totales: ${total_hours.toFixed(1)} hs / ${monthlyLimit} hs (Restantes: ${remaining} hs)\n` +
    `- Ítems trabajados: ${tasks_count}\n` +
    `- Profesionales participantes: ${members_breakdown.length}\n\n` +
    `DESGLOSE POR PROFESIONAL:\n` +
    members_breakdown.map(m => `  * ${m.name}: ${m.hours.toFixed(1)} hs (${m.percent.toFixed(1)}%)`).join('\n') +
    `\n\nNotificación automatizada enviada por Redmine Agile MCP.`
  );
}

async function sendAlertEmail(reportData, threshold) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const totalHours = reportData.total_hours;
  const totalHsFormatted = totalHours.toFixed(1).replace('.', ',');
  const subject = threshold
    ? `[Alerta Soporte L3] Consumo: ${totalHsFormatted}hs / ${MONTHLY_LIMIT}hs (Umbral ${threshold}hs superado)`
    : `[Informe Soporte L3] Estado de Consumo: ${totalHsFormatted}hs / ${MONTHLY_LIMIT}hs`;

  const htmlContent = buildHtmlReport(reportData, threshold);
  const textContent = buildTextFallback(reportData, threshold);

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: process.env.ALERT_EMAIL_TO,
    subject,
    text: textContent,
    html: htmlContent,
  });
}

async function run() {
  const isForce = process.argv.includes('--force');
  const { from, to } = monthRange();
  const monthKey = currentMonthKey();

  if (process.env.REDMINE_API_KEY) {
    process.env.REDMINE_API_KEY = process.env.REDMINE_API_KEY.trim();
  }
  if (process.env.REDMINE_URL) {
    process.env.REDMINE_URL = process.env.REDMINE_URL.trim();
  }

  console.log(`[${monthKey}] Extrayendo datos consolidados del (${from} a ${to})...`);

  // Extraer información consolidada de los proyectos
  const reportData = await getExecutiveReportData({
    project_id: PROJECTS,
    from,
    to,
  });

  if (reportData.status === 'warning' || !reportData.total_hours) {
    console.log('No se encontraron horas imputadas en el período evaluado.');
    return;
  }

  // Formatear rango de fechas legible
  reportData.period_str = `${formatDateSpanish(from)} al ${formatDateSpanish(to)}`;

  const totalHours = Math.round(reportData.total_hours * 100) / 100;
  console.log(`Horas acumuladas en el período: ${totalHours}hs`);

  const state = loadState();
  if (state.month !== monthKey) {
    state.month = monthKey;
    state.alerted = [];
  }
  state.alerted = state.alerted || [];

  if (isForce) {
    console.log(`Modo --force activado. Enviando informe ejecutivo a ${process.env.ALERT_EMAIL_TO}...`);
    await sendAlertEmail(reportData, null);
    return;
  }

  for (const threshold of THRESHOLDS) {
    if (totalHours >= threshold && !state.alerted.includes(threshold)) {
      console.log(`Umbral de ${threshold}hs alcanzado. Enviando alerta ejecutiva HTML a ${process.env.ALERT_EMAIL_TO}...`);
      await sendAlertEmail(reportData, threshold);
      state.alerted.push(threshold);
    }
  }

  saveState(state);
}

run().catch(e => {
  console.error('Error al ejecutar alerta de límite de horas:', e);
  process.exit(1);
});
