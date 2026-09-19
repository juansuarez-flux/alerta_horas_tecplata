/**
 * checkHourLimitAlert.js
 *
 * Suma el consumo de horas del mes en curso para la bolsa de Soporte L3
 * (proyectos "Requerimientos" + "Tareas") y envía un email de alerta al
 * cruzar los umbrales de 40hs y 45hs, sobre un límite acordado de 50hs.
 *
 * Pensado para correr diariamente vía GitHub Actions. El estado de qué
 * umbrales ya se alertaron en el mes se persiste en state/hour-alert-state.json
 * para no reenviar el mismo aviso en cada corrida.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { handler as getTimeEntries } from '../tools/getTimeEntries.js';

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

async function sendAlertEmail(threshold, totalHours) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const remaining = Math.max(0, MONTHLY_LIMIT - totalHours).toFixed(2);
  const subject = `[Alerta Soporte L3] Consumo de horas: ${totalHours.toFixed(2)}hs / ${MONTHLY_LIMIT}hs (umbral ${threshold}hs)`;
  const text =
    `El consumo acumulado de horas en la bolsa de Soporte L3 ` +
    `(${PROJECTS.join(' + ')}) durante ${currentMonthKey()} alcanzó ` +
    `${totalHours.toFixed(2)}hs, superando el umbral de ${threshold}hs.\n\n` +
    `Límite acordado con el cliente: ${MONTHLY_LIMIT}hs.\n` +
    `Horas restantes estimadas: ${remaining}hs.`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: process.env.ALERT_EMAIL_TO,
    subject,
    text,
  });
}

async function run() {
  const { from, to } = monthRange();
  const monthKey = currentMonthKey();

  let totalHours = 0;
  for (const project_id of PROJECTS) {
    const result = await getTimeEntries({ project_id, from, to, limit: 100 });
    totalHours += result.total_hours;
  }
  totalHours = Math.round(totalHours * 100) / 100;

  console.log(`[${monthKey}] Horas acumuladas (${from} a ${to}): ${totalHours}hs`);

  const state = loadState();
  if (state.month !== monthKey) {
    state.month = monthKey;
    state.alerted = [];
  }
  state.alerted = state.alerted || [];

  for (const threshold of THRESHOLDS) {
    if (totalHours >= threshold && !state.alerted.includes(threshold)) {
      console.log(`Umbral de ${threshold}hs alcanzado. Enviando alerta a ${process.env.ALERT_EMAIL_TO}...`);
      await sendAlertEmail(threshold, totalHours);
      state.alerted.push(threshold);
    }
  }

  saveState(state);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
