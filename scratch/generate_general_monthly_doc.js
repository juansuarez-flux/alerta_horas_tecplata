import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  ShadingType,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';

const COLOR_PRIMARY = '0F172A'; // Slate dark blue
const COLOR_SECONDARY = '2563EB'; // Royal blue
const COLOR_ACCENT = '0D9488'; // Teal
const COLOR_BG_LIGHT = 'F8FAFC'; // Light background
const COLOR_TEXT_DARK = '1E293B';

function createHeaderCell(text, widthPercent = null) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: 'FFFFFF',
            size: 20,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      fill: COLOR_PRIMARY,
      type: ShadingType.CLEAR,
    },
    ...(widthPercent ? { width: { size: widthPercent, type: WidthType.PERCENTAGE } } : {}),
  });
}

function createSubHeaderCell(text, widthPercent = null) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: 'FFFFFF',
            size: 19,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      fill: COLOR_SECONDARY,
      type: ShadingType.CLEAR,
    },
    ...(widthPercent ? { width: { size: widthPercent, type: WidthType.PERCENTAGE } } : {}),
  });
}

function createCell(text, options = {}) {
  const { bold = false, align = AlignmentType.LEFT, bg = null, widthPercent = null, size = 18 } = options;
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            color: COLOR_TEXT_DARK,
            size,
            font: 'Arial',
          }),
        ],
        alignment: align,
      }),
    ],
    ...(bg ? { shading: { fill: bg, type: ShadingType.CLEAR } } : {}),
    ...(widthPercent ? { width: { size: widthPercent, type: WidthType.PERCENTAGE } } : {}),
  });
}

async function generateGeneralMonthlyDoc() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // ==================== PAGE 1 ====================
          // Title
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: 'Resumen Ejecutivo General de Horas L3',
                bold: true,
                size: 32,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spaceAfter: 120,
          }),

          // Subtitle / Metadata
          new Paragraph({
            children: [
              new TextRun({
                text: 'Servicios de Soporte Técnico L3  |  Consolidado General sin Segmentación',
                color: COLOR_SECONDARY,
                bold: true,
                size: 20,
                font: 'Arial',
              }),
            ],
            spaceAfter: 60,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Período: Enero 2026 - Julio 2026 (Inc. Abril)  |  Fecha de Emisión: 30 de Julio de 2026',
                color: '64748B',
                size: 18,
                italic: true,
                font: 'Arial',
              }),
            ],
            spaceAfter: 240,
          }),

          // KPIs Grid
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('TOTAL HORAS\n74.0 hs', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 25,
                    size: 20,
                  }),
                  createCell('PERÍODO\n6 Meses (Ene - Jul)', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 25,
                    size: 20,
                  }),
                  createCell('REQUERIMIENTOS\n15 Tickets', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 25,
                    size: 20,
                  }),
                  createCell('RECURSOS\n3 Integrantes', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 25,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 240 }),

          // Section 1: Resumen Mensual
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '1. Resumen Consolidado de Horas por Mes',
                bold: true,
                size: 22,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 120,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Mes / Período', 25),
                  createHeaderCell('Horas Consumidas', 25),
                  createHeaderCell('% del Total', 20),
                  createHeaderCell('Hito o Actividad Principal', 30),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Enero 2026', { bold: true, widthPercent: 25 }),
                  createCell('8.0 hs', { align: AlignmentType.CENTER, widthPercent: 25 }),
                  createCell('10.8%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Reporte Billing SAP y COEM Peso', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Febrero 2026', { bold: true, widthPercent: 25 }),
                  createCell('9.0 hs', { align: AlignmentType.CENTER, widthPercent: 25 }),
                  createCell('12.2%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Comunicación Embarque y Gate N4', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Marzo 2026', { bold: true, widthPercent: 25 }),
                  createCell('12.0 hs', { align: AlignmentType.CENTER, widthPercent: 25 }),
                  createCell('16.2%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Pase a Prod Embarque y Cierre CODE', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Abril 2026', { bold: true, widthPercent: 25 }),
                  createCell('15.0 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 25 }),
                  createCell('20.3%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Groovy Storage Days, Gate y CODE', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Junio 2026', { bold: true, widthPercent: 25 }),
                  createCell('5.0 hs', { align: AlignmentType.CENTER, widthPercent: 25 }),
                  createCell('6.8%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Pruebas Balanza y Facturación FC', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Julio 2026', { bold: true, widthPercent: 25 }),
                  createCell('25.0 hs', { align: AlignmentType.CENTER, widthPercent: 25 }),
                  createCell('33.8%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Análisis Middleware y Soporte L3', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('TOTAL ACUMULADO', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 25 }),
                  createCell('74.0 hs', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 25 }),
                  createCell('100%', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 20 }),
                  createCell('6 Meses de Servicio L3', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 30 }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 200 }),

          // Section 2: Distribución por Tipo de Actividad
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '2. Distribución de Horas por Tipo de Actividad',
                bold: true,
                size: 22,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 120,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Tipo de Actividad', 35),
                  createHeaderCell('Horas Consumidas', 25),
                  createHeaderCell('% del Total', 15),
                  createHeaderCell('Descripción del Trabajo', 25),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Análisis e Investigación', { bold: true, widthPercent: 35 }),
                  createCell('58.3 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 25 }),
                  createCell('78.8%', { align: AlignmentType.CENTER, widthPercent: 15 }),
                  createCell('Groovy Storage Days, Migración MDW, Gate N4, EDI', { widthPercent: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Diagnóstico y Correcciones Técnicas', { bold: true, widthPercent: 35 }),
                  createCell('10.7 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 25 }),
                  createCell('14.5%', { align: AlignmentType.CENTER, widthPercent: 15 }),
                  createCell('Fixes Cierre CODE, Jobs COEM, Billing SAP XML', { widthPercent: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Monitoreo y Reuniones con Cliente', { bold: true, widthPercent: 35 }),
                  createCell('5.0 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 25 }),
                  createCell('6.8%', { align: AlignmentType.CENTER, widthPercent: 15 }),
                  createCell('Pruebas balanza Tecplata y alineación semanal', { widthPercent: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('TOTAL', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 35 }),
                  createCell('74.0 hs', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 25 }),
                  createCell('100%', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 15 }),
                  createCell('Consolidado General', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 25 }),
                ],
              }),
            ],
          }),

          // ==================== PAGE 2 ====================
          new Paragraph({
            pageBreakBefore: true,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '3. Desglose de Horas por Integrante del Equipo',
                bold: true,
                size: 22,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 120,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Integrante del Equipo', 35),
                  createHeaderCell('Horas Consumidas', 25),
                  createHeaderCell('% del Total', 15),
                  createHeaderCell('Responsabilidades Principales', 25),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cristian Bova', { bold: true, widthPercent: 35 }),
                  createCell('49.3 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 25 }),
                  createCell('66.6%', { align: AlignmentType.CENTER, widthPercent: 15 }),
                  createCell('Análisis Middleware, Groovy Storage Days, Reportes N4, Billing SAP', { widthPercent: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Dario Lacerra', { bold: true, widthPercent: 35 }),
                  createCell('19.7 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 25 }),
                  createCell('26.6%', { align: AlignmentType.CENTER, widthPercent: 15 }),
                  createCell('Arquitectura MDW, Cierre CODE, Fixes Jobs COEM, Balanza Tecplata', { widthPercent: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Flux IT (Gestión de Equipo)', { bold: true, widthPercent: 35 }),
                  createCell('5.0 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 25 }),
                  createCell('6.8%', { align: AlignmentType.CENTER, widthPercent: 15 }),
                  createCell('Reuniones técnicas semanales y coordinación de hitos', { widthPercent: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('TOTAL', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 35 }),
                  createCell('74.0 hs', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 25 }),
                  createCell('100%', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 15 }),
                  createCell('Consolidado General', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 25 }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 240 }),

          // Section 4: Conclusiones
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '4. Conclusiones Ejecutivas',
                bold: true,
                size: 22,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 120,
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Eficiencia y Entrega Continua: ', bold: true }),
              new TextRun({ text: 'Se completaron 74.0 horas efectivas de soporte técnico L3 a lo largo de 6 meses, cubriendo requerimientos de fondo en N4, soporte a la operación e integración con middleware.' }),
            ],
            spaceAfter: 60,
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Impacto en Automatizaciones N4: ', bold: true }),
              new TextRun({ text: 'Se automatizó el reporte diario de Gate Transacción con scripts Groovy, se integró el cierre automático de CODE vía evento on_vessel_out y se destrabó el cálculo de cobro de almacenaje en CustomCalculateExportStorageDays.' }),
            ],
            spaceAfter: 60,
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Optimización de Recursos Senior: ', bold: true }),
              new TextRun({ text: 'El 93.2% de las horas ejecutadas correspondieron a desarrollo senior (Cristian Bova y Dario Lacerra), asegurando resoluciones de alto nivel técnico para el cliente.' }),
            ],
            spaceAfter: 200,
          }),

          // Section 5: Observaciones
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '5. Observaciones Técnicas',
                bold: true,
                size: 22,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 120,
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Control de Excepciones: ', bold: true }),
              new TextRun({ text: 'Se agregaron logs de trazabilidad en puntos críticos de retornos nulos en Groovy N4 para diagnóstico rápido.' }),
            ],
            spaceAfter: 60,
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Formatos de Facturación: ', bold: true }),
              new TextRun({ text: 'Se dejó configurado el reporte Billing SAP con IVA subtotal y las plantillas XML de embarque provisorio y definitivo en producción.' }),
            ],
            spaceAfter: 200,
          }),

          // ==================== PAGE 3+ (ANEXO CRONOLÓGICO) ====================
          new Paragraph({
            pageBreakBefore: true,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'Anexo Técnico: Detalle Cronológico Completo por Mes',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 150,
          }),

          // Enero 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Enero 2026 (8.0 hs)',
                bold: true,
                size: 20,
                color: COLOR_SECONDARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 100,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createSubHeaderCell('Ticket', 12),
                  createSubHeaderCell('Tarea / Requerimiento', 36),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Detalle del Trabajo y Avance Técnico', 24),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35838', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Modificación en Reportes (Billing SAP)'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Columna subtotal con IVA en Billing SAP. Pruebas de entorno y VPN.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35118', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Reuniones técnicas y de seguimiento'),
                  createCell('Flux IT'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Seguimiento semanal y alineación de equipo.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35458', { align: AlignmentType.CENTER, bold: true }),
                  createCell('COEM cambiar campo para tomar informe de peso'),
                  createCell('Darío Lacerra'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de campo de peso para el envío de COEM.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 150 }),

          // Febrero 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Febrero 2026 (9.0 hs)',
                bold: true,
                size: 20,
                color: COLOR_SECONDARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 100,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createSubHeaderCell('Ticket', 12),
                  createSubHeaderCell('Tarea / Requerimiento', 36),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Detalle del Trabajo y Avance Técnico', 24),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36641', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Modificación Reporte Comunicación Embarque (Peso BL)'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Modificación de plantilla XML para incluir Peso BL en N4.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36431', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Automatizar Reportes diarios (Gate Transacción N4)'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Diseño de script Groovy e integración con EmailManager N4.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35118', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Reuniones técnicas y de seguimiento'),
                  createCell('Flux IT'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Seguimiento y coordinación de requerimientos.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 150 }),

          // Marzo 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Marzo 2026 (12.0 hs)',
                bold: true,
                size: 20,
                color: COLOR_SECONDARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 100,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createSubHeaderCell('Ticket', 12),
                  createSubHeaderCell('Tarea / Requerimiento', 36),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Detalle del Trabajo y Avance Técnico', 24),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36641', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Modificación Reporte Comunicación Embarque'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Subida a producción de los reportes provisorio y definitivo.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#34679', { align: AlignmentType.CENTER, bold: true }),
                  createCell('COEM - Mejora en notificaciones'),
                  createCell('Cristian Bova'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de permisos de edición de Code Extensions N4.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36301', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Analizar error CODE'),
                  createCell('Darío Lacerra'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Evento on_vessel_out para cierre CODE y mails productivos.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35118', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Reuniones técnicas y de seguimiento'),
                  createCell('Flux IT'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Seguimiento de hitos y tareas de soporte.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36431', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Automatizar Reportes diarios'),
                  createCell('Cristian Bova'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Configuración de Scheduled Jobs N4 y parámetros de Booking.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 150 }),

          // Abril 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Abril 2026 (15.0 hs)',
                bold: true,
                size: 20,
                color: COLOR_SECONDARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 100,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createSubHeaderCell('Ticket', 12),
                  createSubHeaderCell('Tarea / Requerimiento', 36),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Detalle del Trabajo y Avance Técnico', 24),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36431', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Automatizar Reportes diarios (Gate Transacción N4)'),
                  createCell('Cristian Bova'),
                  createCell('9.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Desarrollo y pruebas de script Groovy para Scheduled Jobs y filtros por naviera.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36946', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Info lógica negocios & logs en Groovy CustomCalculateExportStorageDays'),
                  createCell('Cristian Bova'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de calculateStorageEndDate y agregado de logs para evitar trabas en transición de contenedor.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36301', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Analizar error CODE'),
                  createCell('Darío Lacerra'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Pruebas de integración del evento de cierre y validación de correos productivos.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 150 }),

          // Junio 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Junio 2026 (5.0 hs)',
                bold: true,
                size: 20,
                color: COLOR_SECONDARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 100,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createSubHeaderCell('Ticket', 12),
                  createSubHeaderCell('Tarea / Requerimiento', 36),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Detalle del Trabajo y Avance Técnico', 24),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38016', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Horas Dario Junio 2026'),
                  createCell('Dario Lacerra'),
                  createCell('3.7', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Pruebas balanza Tecplata, FC y script Groovy pesadas.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#37951', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Análisis factibilidad FC (Draft → Definitivo)'),
                  createCell('Cristian Bova'),
                  createCell('1.3', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de accesos y entendimiento del flujo FC.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 150 }),

          // Julio 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Julio 2026 (25.0 hs)',
                bold: true,
                size: 20,
                color: COLOR_SECONDARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 100,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createSubHeaderCell('Ticket', 12),
                  createSubHeaderCell('Tarea / Requerimiento', 36),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Detalle del Trabajo y Avance Técnico', 24),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38301', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Análisis de servicios del middleware actual para migración'),
                  createCell('Cristian Bova (10h) / Dario Lacerra (5h)'),
                  createCell('15.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Investigación arquitectura MDW y reuniones de diseño.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38300', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Cristian - Horas de Soporte Julio 2026'),
                  createCell('Cristian Bova'),
                  createCell('9.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Investigación soporte e incidencias Stock AFIP.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38135', { align: AlignmentType.CENTER, bold: true }),
                  createCell('[Preload] Validación VV en EDI Booking'),
                  createCell('Cristian Bova'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de regla de validación Vessel Visit en EDI Booking.'),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), 'Resumen_Ejecutivo_General_L3.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document formatted with exact page breaks saved to: ${outputPath}`);
}

generateGeneralMonthlyDoc().catch((err) => {
  console.error('Error generating document:', err);
  process.exit(1);
});
