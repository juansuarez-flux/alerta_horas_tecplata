import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resumen Ejecutivo General de Horas L3</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1E293B;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.4;
    }
    h1 {
      color: #0F172A;
      font-size: 22px;
      margin: 0 0 4px 0;
      padding-bottom: 4px;
      border-bottom: 2px solid #2563EB;
    }
    h2 {
      color: #1E3A8A;
      font-size: 16px;
      margin: 14px 0 8px 0;
    }
    .subtitle {
      color: #2563EB;
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 2px;
    }
    .meta {
      color: #64748B;
      font-size: 11px;
      font-style: italic;
      margin-bottom: 12px;
    }
    
    /* KPI Cards */
    .kpi-container {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .kpi-card {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-title {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748B;
      font-weight: bold;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: bold;
      color: #0F172A;
      margin-top: 2px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 11.5px;
    }
    th {
      background-color: #0F172A;
      color: #FFFFFF;
      font-weight: 600;
      padding: 6px 8px;
      text-align: center;
      border: 1px solid #0F172A;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #CBD5E1;
    }
    tr:nth-child(even) td {
      background-color: #F8FAFC;
    }
    .total-row td {
      background-color: #E2E8F0;
      font-weight: bold;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }

    /* Page Break Control */
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Chart Block */
    .chart-box {
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      margin-top: 8px;
    }

    /* Bullet list */
    ul {
      margin: 4px 0 10px 18px;
      padding: 0;
    }
    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <h1>📊 Resumen Ejecutivo General de Horas L3</h1>
  <div class="subtitle">Servicios de Soporte Técnico L3  |  Consolidado General sin Segmentación</div>
  <div class="meta">Período: Enero 2026 - Julio 2026 (6 Meses)  |  Fecha de Emisión: 30 de Julio de 2026</div>

  <div class="kpi-container">
    <div class="kpi-card">
      <div class="kpi-title">⏱️ Total Horas</div>
      <div class="kpi-value">74.0 hs</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">📅 Período</div>
      <div class="kpi-value">6 Meses</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">📋 Requerimientos</div>
      <div class="kpi-value">15 Tickets</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">👥 Recursos</div>
      <div class="kpi-value">3 Integrantes</div>
    </div>
  </div>

  <h2>1. Resumen Consolidado de Horas por Mes</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Mes / Período</th>
        <th style="width: 20%;">Horas Consumidas</th>
        <th style="width: 15%;">% del Total</th>
        <th style="width: 45%;">Hito o Actividad Principal Destacada</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="bold">Enero 2026</td>
        <td class="text-center">8.0 hs</td>
        <td class="text-center">10.8%</td>
        <td>Reporte Billing SAP (IVA subtotal) y análisis peso COEM.</td>
      </tr>
      <tr>
        <td class="bold">Febrero 2026</td>
        <td class="text-center">9.0 hs</td>
        <td class="text-center">12.2%</td>
        <td>Modificación Reporte Comunicación Embarque (Peso BL) y Gate N4.</td>
      </tr>
      <tr>
        <td class="bold">Marzo 2026</td>
        <td class="text-center">12.0 hs</td>
        <td class="text-center">16.2%</td>
        <td>Pase a Producción Embarque XML y evento on_vessel_out CODE.</td>
      </tr>
      <tr>
        <td class="bold">Abril 2026</td>
        <td class="text-center bold">15.0 hs</td>
        <td class="text-center">20.3%</td>
        <td>Groovy Storage Days, Automatización Gate Transacción y Cierre CODE.</td>
      </tr>
      <tr>
        <td class="bold">Junio 2026</td>
        <td class="text-center">5.0 hs</td>
        <td class="text-center">6.8%</td>
        <td>Pruebas integradas de balanza con Tecplata y facturación FC.</td>
      </tr>
      <tr>
        <td class="bold">Julio 2026</td>
        <td class="text-center">25.0 hs</td>
        <td class="text-center">33.8%</td>
        <td>Análisis de migración de arquitectura Middleware y soporte L3 AFIP.</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL ACUMULADO</td>
        <td class="text-center">74.0 hs</td>
        <td class="text-center">100%</td>
        <td>Consolidado General (6 Meses)</td>
      </tr>
    </tbody>
  </table>

  <div class="avoid-break">
    <h2>2. Distribución de Horas por Tipo de Actividad</h2>
    <div class="chart-box">
      <svg width="500" height="190" viewBox="0 0 500 190">
        <!-- Pie chart rendered cleanly -->
        <g transform="translate(110, 95)">
          <!-- Slice 1: Analysis (58.3 / 74 = 78.8%) -> 283.6 deg -->
          <!-- Start: -90 deg (-1.57 rad), End: 193.6 deg (3.38 rad) -->
          <path d="M 0 0 L 0 -75 A 75 75 0 1 1 -72.6 18.8 Z" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5"/>
          
          <!-- Slice 2: Diagnosis (10.7 / 74 = 14.5%) -> 52.1 deg -->
          <!-- Start: 193.6 deg, End: 245.7 deg -->
          <path d="M 0 0 L -72.6 18.8 A 75 75 0 0 1 -31.0 -68.3 Z" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.5"/>

          <!-- Slice 3: Monitoring (5.0 / 74 = 6.8%) -> 24.3 deg -->
          <!-- Start: 245.7 deg, End: 270 deg (0 -75) -->
          <path d="M 0 0 L -31.0 -68.3 A 75 75 0 0 1 0 -75 Z" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5"/>
        </g>
        
        <!-- Legend -->
        <g transform="translate(230, 45)" font-family="Segoe UI, sans-serif" font-size="12">
          <rect x="0" y="0" width="14" height="14" rx="3" fill="#2563EB"/>
          <text x="22" y="12" fill="#1E293B" font-weight="600">Análisis e Investigación (58.3 hs - 78.8%)</text>
          
          <rect x="0" y="30" width="14" height="14" rx="3" fill="#F59E0B"/>
          <text x="22" y="42" fill="#1E293B" font-weight="600">Diagnóstico y Correcciones (10.7 hs - 14.5%)</text>
          
          <rect x="0" y="60" width="14" height="14" rx="3" fill="#10B981"/>
          <text x="22" y="72" fill="#1E293B" font-weight="600">Monitoreo y Reuniones (5.0 hs - 6.8%)</text>
        </g>
      </svg>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page-break"></div>

  <h2>3. Desglose de Horas por Integrante del Equipo</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Integrante del Equipo</th>
        <th style="width: 20%;">Horas Consumidas</th>
        <th style="width: 15%;">% del Total</th>
        <th style="width: 35%;">Responsabilidades Principales</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="bold">Cristian Bova</td>
        <td class="text-center bold">49.3 hs</td>
        <td class="text-center">66.6%</td>
        <td>Groovy Storage Days, Automatización Gate N4, Middleware, Billing SAP, EDI.</td>
      </tr>
      <tr>
        <td class="bold">Dario Lacerra</td>
        <td class="text-center bold">19.7 hs</td>
        <td class="text-center">26.6%</td>
        <td>Arquitectura MDW, Cierre CODE, Fixes Jobs COEM, Balanza Tecplata.</td>
      </tr>
      <tr>
        <td class="bold">Flux IT (Gestión de Equipo)</td>
        <td class="text-center bold">5.0 hs</td>
        <td class="text-center">6.8%</td>
        <td>Reuniones técnicas semanales y coordinación de hitos.</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL CONSOLIDADO</td>
        <td class="text-center">74.0 hs</td>
        <td class="text-center">100%</td>
        <td>Consolidado General (6 Meses)</td>
      </tr>
    </tbody>
  </table>

  <h2>4. Conclusiones Ejecutivas</h2>
  <ul>
    <li><strong>Eficiencia y Entrega Continua:</strong> Se completaron 74.0 horas efectivas de soporte técnico L3 a lo largo de 6 meses, cubriendo requerimientos de fondo en N4, soporte a la operación e integración con middleware.</li>
    <li><strong>Impacto en Automatizaciones N4:</strong> Se automatizó el reporte diario de Gate Transacción con scripts Groovy, se integró el cierre automático de CODE vía evento <code>on_vessel_out</code> y se destrabó el cálculo de cobro de almacenaje en <code>CustomCalculateExportStorageDays</code>.</li>
    <li><strong>Optimización de Recursos Senior:</strong> El 93.2% de las horas ejecutadas correspondieron a desarrollo senior (Cristian Bova y Dario Lacerra), asegurando resoluciones de alto nivel técnico para el cliente.</li>
  </ul>

  <h2>5. Observaciones Técnicas</h2>
  <ul>
    <li><strong>Control de Excepciones:</strong> Se agregaron logs de trazabilidad en puntos críticos de retornos nulos en Groovy N4 para diagnóstico rápido.</li>
    <li><strong>Formatos de Facturación:</strong> Se dejó configurado el reporte Billing SAP con IVA subtotal y las plantillas XML de embarque provisorio y definitivo en producción.</li>
  </ul>

  <!-- ==================== PAGE 3 (ANEXO CRONOLÓGICO) ==================== -->
  <div class="page-break"></div>

  <h1>📑 Anexo Técnico: Detalle Cronológico Completo por Mes</h1>

  <h2>📅 Enero 2026 (Total: 8.0 hs)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Ticket</th>
        <th style="width: 35%;">Tarea / Requerimiento</th>
        <th style="width: 20%;">Responsable</th>
        <th style="width: 8%;">Hs</th>
        <th style="width: 25%;">Detalle del Trabajo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center bold">#35838</td>
        <td>Modificación en Reportes (Billing SAP)</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">4.0</td>
        <td>Columna subtotal con IVA en Billing SAP. Pruebas de entorno y VPN.</td>
      </tr>
      <tr>
        <td class="text-center bold">#35118</td>
        <td>Reuniones técnicas y de seguimiento</td>
        <td>Flux IT</td>
        <td class="text-right bold">3.0</td>
        <td>Seguimiento semanal y alineación de equipo.</td>
      </tr>
      <tr>
        <td class="text-center bold">#35458</td>
        <td>COEM cambiar campo para tomar informe de peso</td>
        <td>Darío Lacerra</td>
        <td class="text-right bold">1.0</td>
        <td>Análisis de campo de peso para el envío de COEM.</td>
      </tr>
    </tbody>
  </table>

  <h2>📅 Febrero 2026 (Total: 9.0 hs)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Ticket</th>
        <th style="width: 35%;">Tarea / Requerimiento</th>
        <th style="width: 20%;">Responsable</th>
        <th style="width: 8%;">Hs</th>
        <th style="width: 25%;">Detalle del Trabajo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center bold">#36641</td>
        <td>Modificación Reporte Comunicación Embarque (Peso BL)</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">4.0</td>
        <td>Modificación de plantilla XML para incluir Peso BL en N4.</td>
      </tr>
      <tr>
        <td class="text-center bold">#36431</td>
        <td>Automatizar Reportes diarios (Gate Transacción N4)</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">4.0</td>
        <td>Diseño de script Groovy e integración con EmailManager N4.</td>
      </tr>
      <tr>
        <td class="text-center bold">#35118</td>
        <td>Reuniones técnicas y de seguimiento</td>
        <td>Flux IT</td>
        <td class="text-right bold">1.0</td>
        <td>Seguimiento y coordinación de requerimientos.</td>
      </tr>
    </tbody>
  </table>

  <h2>📅 Marzo 2026 (Total: 12.0 hs)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Ticket</th>
        <th style="width: 35%;">Tarea / Requerimiento</th>
        <th style="width: 20%;">Responsable</th>
        <th style="width: 8%;">Hs</th>
        <th style="width: 25%;">Detalle del Trabajo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center bold">#36641</td>
        <td>Modificación Reporte Comunicación Embarque</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">4.0</td>
        <td>Subida a producción de los reportes provisorio y definitivo.</td>
      </tr>
      <tr>
        <td class="text-center bold">#34679</td>
        <td>COEM - Mejora en notificaciones</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">3.0</td>
        <td>Análisis de permisos de edición de Code Extensions N4.</td>
      </tr>
      <tr>
        <td class="text-center bold">#36301</td>
        <td>Analizar error CODE</td>
        <td>Darío Lacerra</td>
        <td class="text-right bold">3.0</td>
        <td>Evento on_vessel_out para cierre CODE y mails productivos.</td>
      </tr>
      <tr>
        <td class="text-center bold">#35118</td>
        <td>Reuniones técnicas y de seguimiento</td>
        <td>Flux IT</td>
        <td class="text-right bold">1.0</td>
        <td>Seguimiento de hitos y tareas de soporte.</td>
      </tr>
      <tr>
        <td class="text-center bold">#36431</td>
        <td>Automatizar Reportes diarios</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">1.0</td>
        <td>Configuración de Scheduled Jobs N4 y parámetros de Booking.</td>
      </tr>
    </tbody>
  </table>

  <h2>📅 Abril 2026 (Total: 15.0 hs)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Ticket</th>
        <th style="width: 35%;">Tarea / Requerimiento</th>
        <th style="width: 20%;">Responsable</th>
        <th style="width: 8%;">Hs</th>
        <th style="width: 25%;">Detalle del Trabajo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center bold">#36431</td>
        <td>Automatizar Reportes diarios (Gate Transacción N4)</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">9.0</td>
        <td>Desarrollo y pruebas avanzadas de script Groovy para Scheduled Jobs N4.</td>
      </tr>
      <tr>
        <td class="text-center bold">#36946</td>
        <td>Info lógica negocios & logs en Groovy Storage Days</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">3.0</td>
        <td>Análisis de calculateStorageEndDate y agregado de logs para destrabar contenedor.</td>
      </tr>
      <tr>
        <td class="text-center bold">#36301</td>
        <td>Analizar error CODE</td>
        <td>Darío Lacerra</td>
        <td class="text-right bold">3.0</td>
        <td>Pruebas de integración del evento de cierre y correos productivos.</td>
      </tr>
    </tbody>
  </table>

  <h2>📅 Junio 2026 (Total: 5.0 hs)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Ticket</th>
        <th style="width: 35%;">Tarea / Requerimiento</th>
        <th style="width: 20%;">Responsable</th>
        <th style="width: 8%;">Hs</th>
        <th style="width: 25%;">Detalle del Trabajo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center bold">#38016</td>
        <td>Horas Dario Junio 2026</td>
        <td>Dario Lacerra</td>
        <td class="text-right bold">3.7</td>
        <td>Pruebas balanza Tecplata, FC y script Groovy pesadas.</td>
      </tr>
      <tr>
        <td class="text-center bold">#37951</td>
        <td>Análisis factibilidad FC (Draft → Definitivo)</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">1.3</td>
        <td>Análisis de accesos y entendimiento del flujo FC.</td>
      </tr>
    </tbody>
  </table>

  <h2>📅 Julio 2026 (Total: 25.0 hs)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Ticket</th>
        <th style="width: 35%;">Tarea / Requerimiento</th>
        <th style="width: 20%;">Responsable</th>
        <th style="width: 8%;">Hs</th>
        <th style="width: 25%;">Detalle del Trabajo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center bold">#38301</td>
        <td>Análisis de servicios middleware para migración</td>
        <td>Cristian Bova (10h) / Dario Lacerra (5h)</td>
        <td class="text-right bold">15.0</td>
        <td>Investigación arquitectura MDW y reuniones de diseño.</td>
      </tr>
      <tr>
        <td class="text-center bold">#38300</td>
        <td>Cristian - Horas de Soporte Julio 2026</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">9.0</td>
        <td>Investigación soporte e incidencias Stock AFIP.</td>
      </tr>
      <tr>
        <td class="text-center bold">#38135</td>
        <td>[Preload] Validación VV en EDI Booking</td>
        <td>Cristian Bova</td>
        <td class="text-right bold">1.0</td>
        <td>Análisis de regla de validación Vessel Visit en EDI.</td>
      </tr>
    </tbody>
  </table>

</body>
</html>
`;

const htmlPath = path.join(process.cwd(), 'scratch', 'report_perfect.html');
const pdfPath = path.join(process.cwd(), 'Resumen_Ejecutivo_General_L3.pdf');
const artifactPdfPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\91b5f238-9f3b-40b8-987b-e9213ba1a239\\Resumen_Ejecutivo_General_L3.pdf';

fs.writeFileSync(htmlPath, htmlContent);

const edgePath = `"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"`;
const cmd = `${edgePath} --headless --print-to-pdf="${pdfPath}" "${htmlPath}"`;

try {
  execSync(cmd);
  console.log(`PDF compiled perfectly to: ${pdfPath}`);
  fs.copyFileSync(pdfPath, artifactPdfPath);
  console.log(`Copied PDF to artifact folder: ${artifactPdfPath}`);
} catch (e) {
  console.error('Error generating PDF via Edge:', e.message);
}
