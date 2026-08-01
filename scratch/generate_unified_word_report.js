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

const COLOR_PRIMARY = '003366'; // Dark Navy Blue
const COLOR_SECONDARY = '4682B4'; // Steel Blue
const COLOR_ACCENT = '2E8B57'; // Sea Green accent
const COLOR_BG_LIGHT = 'F0F4F8'; // Light background
const COLOR_TEXT_DARK = '222222';

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
  const { bold = false, align = AlignmentType.LEFT, bg = null, widthPercent = null, size = 18, italic = false } = options;
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            italic,
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

async function generateUnifiedDoc() {
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
          // Title
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: 'Resumen Ejecutivo Consolidado de Horas y Tareas L3',
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
                text: 'Proyectos Unificados: ',
                bold: true,
                color: COLOR_TEXT_DARK,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: 'Soporte L3 2025-2026 - Requerimientos + Soporte L3 2025-2026 - Tareas',
                color: COLOR_SECONDARY,
                bold: true,
                size: 22,
                font: 'Arial',
              }),
            ],
            spaceAfter: 60,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Período Consolidado: Enero 2026 - Julio 2026  |  Fecha de Emisión: 30 de Julio de 2026',
                color: '666666',
                size: 18,
                italic: true,
                font: 'Arial',
              }),
            ],
            spaceAfter: 300,
          }),

          // Consolidated Metrics Grid
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('TOTAL CONSOLIDADO\n59.0 hs', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 25,
                    size: 20,
                  }),
                  createCell('REQUERIMIENTOS (SPENT TIME)\n30.0 hs (50.8%)', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 25,
                    size: 20,
                  }),
                  createCell('TAREAS MENSUALES (EXCEL)\n29.0 hs (49.2%)', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 25,
                    size: 20,
                  }),
                  createCell('TOTAL TICKETS TRABAJADOS\n14 Tickets Redmine', {
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

          new Paragraph({ text: '', spaceAfter: 300 }),

          // Section 1: Resumen Ejecutivo y Totales por Desarrollador
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '1. Consolidados de Horas por Proyecto e Integrante',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 150,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Integrante / Recurso', 30),
                  createHeaderCell('Proyecto Requerimientos', 22),
                  createHeaderCell('Proyecto Tareas', 22),
                  createHeaderCell('Total Horas', 14),
                  createHeaderCell('% Total', 12),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cristian Bova (Desarrollador)', { bold: true, widthPercent: 30 }),
                  createCell('21.3 hs', { align: AlignmentType.CENTER, widthPercent: 22 }),
                  createCell('16.0 hs', { align: AlignmentType.CENTER, widthPercent: 22 }),
                  createCell('37.3 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 14 }),
                  createCell('63.2%', { align: AlignmentType.CENTER, widthPercent: 12 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Dario Lacerra (TL / Desarrollador)', { bold: true, widthPercent: 30 }),
                  createCell('8.7 hs', { align: AlignmentType.CENTER, widthPercent: 22 }),
                  createCell('8.0 hs', { align: AlignmentType.CENTER, widthPercent: 22 }),
                  createCell('16.7 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 14 }),
                  createCell('28.3%', { align: AlignmentType.CENTER, widthPercent: 12 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Flux IT / Gestión Equipo (Reuniones)', { bold: true, widthPercent: 30 }),
                  createCell('0.0 hs', { align: AlignmentType.CENTER, widthPercent: 22 }),
                  createCell('5.0 hs', { align: AlignmentType.CENTER, widthPercent: 22 }),
                  createCell('5.0 hs', { align: AlignmentType.CENTER, bold: true, widthPercent: 14 }),
                  createCell('8.5%', { align: AlignmentType.CENTER, widthPercent: 12 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('TOTAL CONSOLIDADO', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 30 }),
                  createCell('30.0 hs', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 22 }),
                  createCell('29.0 hs', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 22 }),
                  createCell('59.0 hs', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 14 }),
                  createCell('100%', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 12 }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 300 }),

          // Section 2: Análisis Detallado Proyecto 2 - Tareas (Imágenes)
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '2. Detalle del Proyecto: Soporte L3 2025-2026 - Tareas (29.0 hs)',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 150,
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'A continuación se presenta el desglose mensual de las horas consumidas en el proyecto de Tareas, complementado con el análisis técnico de los comentarios (Journals) registrados en Redmine para cada ticket:',
                size: 20,
                font: 'Arial',
              }),
            ],
            spaceAfter: 200,
          }),

          // Sub-tabla Enero 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Enero 2026 - Total: 8.0 hs consumidas',
                bold: true,
                size: 21,
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
                  createSubHeaderCell('Issue Redmine', 32),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Estado & Comentarios Técnicos (Redmine)', 28),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35838', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Modificación en Reportes (Factura Crédito / Billing SAP)'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Cerrado. Ajuste columna subtotal con IVA en Billing. Pruebas de ambiente y VPN.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35118', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Reuniones técnicas y de seguimiento'),
                  createCell('Flux IT'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('En curso. Seguimiento de equipo y reuniones planificadas.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35458', { align: AlignmentType.CENTER, bold: true }),
                  createCell('COEM cambiar campo para tomar el informe de peso'),
                  createCell('Darío Lacerra'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('En espera. Análisis de campo de peso en registro COEM.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#34987', { align: AlignmentType.CENTER }),
                  createCell('COEM - Error en guardado de número de carátula'),
                  createCell('Darío Lacerra'),
                  createCell('0.0', { align: AlignmentType.RIGHT }),
                  createCell('Fix aplicado en Job COEM (booking=0 y control de id carátula).'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#34679', { align: AlignmentType.CENTER }),
                  createCell('COEM - Mejora en notificaciones'),
                  createCell('Cristian Bova'),
                  createCell('0.0', { align: AlignmentType.RIGHT }),
                  createCell('En análisis de permisos para edit extensions en N4.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 200 }),

          // Sub-tabla Febrero 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Febrero 2026 - Total: 9.0 hs consumidas',
                bold: true,
                size: 21,
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
                  createSubHeaderCell('Issue Redmine', 32),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Estado & Comentarios Técnicos (Redmine)', 28),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36641', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Modificación Reporte Comunicación Embarque (Peso BL)'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('En espera respuesta TecPlata. Modificación de ReportDesign XML.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36431', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Automatizar Reportes diarios (Gate Transacción N4)'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('En curso. Diseño de arquitectura Groovy Script & EmailManager.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35118', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Reuniones técnicas y de seguimiento'),
                  createCell('Flux IT'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('En curso. Reuniones técnicas semanales.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35460', { align: AlignmentType.CENTER }),
                  createCell('Registrar carátula'),
                  createCell('Darío Lacerra'),
                  createCell('0.0', { align: AlignmentType.RIGHT }),
                  createCell('Cerrado. Condición en Job para no disparar evento sin booking/elos.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 200 }),

          // Sub-tabla Marzo 2026
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '📅 Marzo 2026 - Total: 12.0 hs consumidas',
                bold: true,
                size: 21,
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
                  createSubHeaderCell('Issue Redmine', 32),
                  createSubHeaderCell('Responsable', 20),
                  createSubHeaderCell('Hs', 8),
                  createSubHeaderCell('Estado & Comentarios Técnicos (Redmine)', 28),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36641', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Modificación Reporte Comunicación Embarque'),
                  createCell('Cristian Bova'),
                  createCell('4.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Archivos XML provisorio y definitivo subidos a producción.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#34679', { align: AlignmentType.CENTER, bold: true }),
                  createCell('COEM - Mejora en notificaciones'),
                  createCell('Cristian Bova'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de permisos en Code Extensions N4.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36301', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Analizar error CODE'),
                  createCell('Darío Lacerra'),
                  createCell('3.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Ready to test. Evento on_vessel_out para cierre CODE y mails prod.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#35118', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Reuniones técnicas y de seguimiento'),
                  createCell('Flux IT'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('En curso. Reuniones de alineación de equipo.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#36431', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Automatizar Reportes diarios'),
                  createCell('Cristian Bova'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Configuración de Scheduled Jobs N4 y filtros de booking.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 300 }),

          // Section 3: Proyecto Requerimientos (Spent Time)
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '3. Detalle del Proyecto: Soporte L3 2025-2026 - Requerimientos (30.0 hs)',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 150,
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Ticket', 12),
                  createHeaderCell('Requerimiento', 36),
                  createHeaderCell('Responsable', 20),
                  createHeaderCell('Horas', 10),
                  createHeaderCell('Actividad Realizada', 22),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38301', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Análisis de servicios del middleware actual para migración'),
                  createCell('Cristian Bova (10h) / Dario Lacerra (5h)'),
                  createCell('15.0 hs', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de arquitectura MDW y reuniones técnicas.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38300', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Cristian - Horas de Soporte Julio 2026'),
                  createCell('Cristian Bova'),
                  createCell('9.0 hs', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Investigación soporte e incidencias Stock AFIP.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38016', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Horas Dario Junio 2026'),
                  createCell('Dario Lacerra'),
                  createCell('3.7 hs', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Pruebas balanza Tecplata, FC y script Groovy.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#37951', { align: AlignmentType.CENTER, bold: true }),
                  createCell('Análisis factibilidad FC (Draft → Definitivo)'),
                  createCell('Cristian Bova'),
                  createCell('1.3 hs', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Evaluación de accesos y flujo de estado FC.'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('#38135', { align: AlignmentType.CENTER, bold: true }),
                  createCell('[Preload] Validación VV en EDI Booking'),
                  createCell('Cristian Bova'),
                  createCell('1.0 h', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Análisis de regla de validación VV.'),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 300 }),

          // Section 4: Conclusiones
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '4. Conclusiones y Resumen para el Cliente',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
                font: 'Arial',
              }),
            ],
            spaceAfter: 150,
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Consolidación Total: ', bold: true }),
              new TextRun({ text: 'Se han completado y documentado 59.0 horas efectivas de soporte L3 divididas equitativamente entre Requerimientos de fondo (30.0 hs) y Tareas de mantenimiento/automatización N4 (29.0 hs).' }),
            ],
            spaceAfter: 60,
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Principales Hitos Técnicos Entregados: ', bold: true }),
              new TextRun({ text: 'Finalización del análisis de migración de middleware, corrección del flujo de carátula en jobs COEM, subida a producción de los reportes de Comunicación de Embarque en N4 y resolución del evento de cierre CODE.' }),
            ],
            spaceAfter: 60,
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Eficiencia Operativa: ', bold: true }),
              new TextRun({ text: 'El 91.5% de las horas totales fueron ejecutadas directamente por los desarrolladores sénior (Cristian Bova y Dario Lacerra), asegurando resoluciones técnicas de alto valor para la operación de la terminal.' }),
            ],
            spaceAfter: 120,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), 'Resumen_Ejecutivo_Unificado_Soporte_L3.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Unified Document saved successfully to: ${outputPath}`);
}

generateUnifiedDoc().catch((err) => {
  console.error('Error generating unified document:', err);
  process.exit(1);
});
