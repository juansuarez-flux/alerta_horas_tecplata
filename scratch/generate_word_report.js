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
  BorderStyle,
  ShadingType,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';

// Primary colors for corporate styling
const COLOR_PRIMARY = '003366'; // Navy blue
const COLOR_SECONDARY = '4682B4'; // Steel blue
const COLOR_BG_LIGHT = 'F0F4F8'; // Light gray-blue background
const COLOR_TEXT_DARK = '222222';
const COLOR_BORDER = 'CCCCCC';

function createHeaderCell(text, widthPercent = null) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: 'FFFFFF',
            size: 20, // 10pt
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

async function buildDoc() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
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
                text: 'Resumen Ejecutivo: Reporte de Horas Incurridas (Spent Time)',
                bold: true,
                size: 32, // 16pt
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
                text: 'Proyecto: ',
                bold: true,
                color: COLOR_TEXT_DARK,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: 'Soporte L3 2025-2026 - Requerimientos',
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
                text: 'Identificador: soporte-l3-2025-2026-requerimientos  |  Fecha de Corte: 30 de Julio de 2026',
                color: '666666',
                size: 18,
                italic: true,
                font: 'Arial',
              }),
            ],
            spaceAfter: 300,
          }),

          // Metric Summary Box
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('TOTAL HORAS REGISTRADAS\n30.0 hs', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 33,
                    size: 20,
                  }),
                  createCell('TOTAL IMPUTACIONES\n11 Registros', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 33,
                    size: 20,
                  }),
                  createCell('DESARROLLADORES\n2 Integrantes', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    bg: COLOR_BG_LIGHT,
                    widthPercent: 34,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 300 }),

          // Section 1: Desglose por Integrante
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '1. Desglose de Horas por Integrante del Equipo',
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
                  createHeaderCell('Integrante', 30),
                  createHeaderCell('Horas Imputadas', 20),
                  createHeaderCell('% del Total', 20),
                  createHeaderCell('Actividades Destacadas', 30),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cristian Bova', { bold: true, widthPercent: 30 }),
                  createCell('21.3 hs', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('71.0%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Investigación, Middleware, Stock AFIP', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Dario Lacerra', { bold: true, widthPercent: 30 }),
                  createCell('8.7 hs', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('29.0%', { align: AlignmentType.CENTER, widthPercent: 20 }),
                  createCell('Middleware, Balanza Tecplata, FC & Groovy', { widthPercent: 30 }),
                ],
              }),
              new TableRow({
                children: [
                  createCell('TOTAL', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 30 }),
                  createCell('30.0 hs', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 20 }),
                  createCell('100%', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, widthPercent: 20 }),
                  createCell('11 Registros de tiempo', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 30 }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spaceAfter: 300 }),

          // Section 2: Desglose por Requerimiento
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '2. Desglose por Tarea y Requerimiento',
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
              new TextRun({ text: 'Tarea #38301 - Análisis de servicios del middleware actual para migración: ', bold: true }),
              new TextRun({ text: '15.0 hs (Cristian Bova: 10.0 hs | Dario Lacerra: 5.0 hs)', bold: true, color: COLOR_SECONDARY }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Cristian Bova: Investigación y Análisis técnico de arquitectura del middleware.' }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Dario Lacerra: Análisis de servicios vigentes y reuniones técnicas MDW.' }),
            ],
            spaceAfter: 120,
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tarea #38300 - Cristian - Horas de Soporte Julio 2026: ', bold: true }),
              new TextRun({ text: '9.0 hs (Cristian Bova)', bold: true, color: COLOR_SECONDARY }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Análisis e investigación general de tickets de soporte L3 (6.0 hs).' }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Diagnóstico y resolución de incidencias en Stock AFIP (3.0 hs).' }),
            ],
            spaceAfter: 120,
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tarea #38016 - Horas Dario Junio 2026: ', bold: true }),
              new TextRun({ text: '3.7 hs (Dario Lacerra)', bold: true, color: COLOR_SECONDARY }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Estimación de modificaciones en FC para facturas no finalizadas (1.5 hs).' }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Reunión y pruebas integradas de balanza con Tecplata (1.2 hs).' }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Sincronización PL y revisión de script Groovy para pesadas (1.0 h).' }),
            ],
            spaceAfter: 120,
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tarea #37951 - Análisis de factibilidad para cambio manual de estado de FC (Draft → Definitivo): ', bold: true }),
              new TextRun({ text: '1.3 hs (Cristian Bova)', bold: true, color: COLOR_SECONDARY }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Análisis de factibilidad, chequeo de accesos y entendimiento del flujo de FC.' }),
            ],
            spaceAfter: 120,
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tarea #38135 - [Preload] Validación de estado de Vessel Visit (VV) en procesamiento de EDI Booking: ', bold: true }),
              new TextRun({ text: '1.0 h (Cristian Bova)', bold: true, color: COLOR_SECONDARY }),
            ],
            spaceAfter: 40,
          }),
          new Paragraph({
            bullet: { level: 1 },
            children: [
              new TextRun({ text: '• Análisis del requerimiento para validación del estado VV.' }),
            ],
            spaceAfter: 300,
          }),

          // Section 3: Tabla Detallada
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '3. Registro Cronológico Completo de Imputaciones',
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
                  createHeaderCell('Fecha', 14),
                  createHeaderCell('Desarrollador', 20),
                  createHeaderCell('Tarea', 12),
                  createHeaderCell('Actividad', 14),
                  createHeaderCell('Hs', 8),
                  createHeaderCell('Detalle del Trabajo Realizado', 32),
                ],
              }),
              new TableRow({
                children: [
                  createCell('30/07/2026', { align: AlignmentType.CENTER }),
                  createCell('Dario Lacerra'),
                  createCell('#38301', { align: AlignmentType.CENTER }),
                  createCell('Analysis'),
                  createCell('5.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Analisis de servicios actuales + reuniones MDW'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('30/07/2026', { align: AlignmentType.CENTER }),
                  createCell('Cristian Bova'),
                  createCell('#38301', { align: AlignmentType.CENTER }),
                  createCell('Analysis'),
                  createCell('10.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Investigación y Analisis'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('29/07/2026', { align: AlignmentType.CENTER }),
                  createCell('Cristian Bova'),
                  createCell('#38135', { align: AlignmentType.CENTER }),
                  createCell('Analysis'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Analisis del requerimiento'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('24/07/2026', { align: AlignmentType.CENTER }),
                  createCell('Cristian Bova'),
                  createCell('#38300', { align: AlignmentType.CENTER }),
                  createCell('Analysis'),
                  createCell('6.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Analisis e investigacion'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('23/07/2026', { align: AlignmentType.CENTER }),
                  createCell('Cristian Bova'),
                  createCell('#38300', { align: AlignmentType.CENTER }),
                  createCell('Analysis'),
                  createCell('2.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Error en stock de afip'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('23/07/2026', { align: AlignmentType.CENTER }),
                  createCell('Cristian Bova'),
                  createCell('#38300', { align: AlignmentType.CENTER }),
                  createCell('Analysis'),
                  createCell('1.0', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Error en stock de afip'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('11/06/2026', { align: AlignmentType.CENTER }),
                  createCell('Dario Lacerra'),
                  createCell('#38016', { align: AlignmentType.CENTER }),
                  createCell('Monitoring'),
                  createCell('1.2', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('reunion pruebas de balanza con tecplata'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('09/06/2026', { align: AlignmentType.CENTER }),
                  createCell('Dario Lacerra'),
                  createCell('#38016', { align: AlignmentType.CENTER }),
                  createCell('Diagnosis'),
                  createCell('0.5', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('sync pl'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('09/06/2026', { align: AlignmentType.CENTER }),
                  createCell('Dario Lacerra'),
                  createCell('#38016', { align: AlignmentType.CENTER }),
                  createCell('Diagnosis'),
                  createCell('1.5', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('estimacion cambios FC que no filalice facturas'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('09/06/2026', { align: AlignmentType.CENTER }),
                  createCell('Dario Lacerra'),
                  createCell('#38016', { align: AlignmentType.CENTER }),
                  createCell('Diagnosis'),
                  createCell('0.5', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('revisión version groovy para pesadas y envio mail'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('02/06/2026', { align: AlignmentType.CENTER }),
                  createCell('Cristian Bova'),
                  createCell('#37951', { align: AlignmentType.CENTER }),
                  createCell('Analysis'),
                  createCell('1.3', { align: AlignmentType.RIGHT, bold: true }),
                  createCell('Analisis y entendimiento del requerimiento, chequear accesos, entender flujo FC'),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), 'Resumen_Ejecutivo_Horas_Soporte_L3.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document saved successfully to: ${outputPath}`);
}

buildDoc().catch((err) => {
  console.error('Error generating document:', err);
  process.exit(1);
});
