import * as fs from 'fs';
import * as path from 'path';

// Robust dynamic loader for docx library
let docxModule;
try {
  docxModule = await import('docx');
} catch {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'docx', 'dist', 'index.mjs'),
    path.join('c:/Users/LENOVO/Documents/mcp-redmine', 'node_modules', 'docx', 'dist', 'index.mjs')
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      docxModule = await import('file:///' + cand.replace(/\\/g, '/'));
      break;
    }
  }
}

if (!docxModule) {
  throw new Error('Could not resolve docx library. Ensure docx is installed.');
}

const {
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
  BorderStyle,
  ImageRun,
} = docxModule;

// Corporate Color Palette
const COLOR_PRIMARY = '003366'; // Navy Blue
const COLOR_SECONDARY = '4682B4'; // Steel Blue
const COLOR_BG_LIGHT = 'F4F7F9'; // Soft light grey-blue
const COLOR_BG_HEADER = 'EBF2F7'; // Accent light fill
const COLOR_TEXT_DARK = '222222';
const COLOR_TEXT_MUTED = '555555';
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
            size: 20,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
    },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
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
    shading: { fill: COLOR_SECONDARY, type: ShadingType.CLEAR },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_SECONDARY },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_SECONDARY },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_SECONDARY },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_SECONDARY },
    },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    ...(widthPercent ? { width: { size: widthPercent, type: WidthType.PERCENTAGE } } : {}),
  });
}

function createCell(text, options = {}) {
  const {
    bold = false,
    align = AlignmentType.LEFT,
    bg = null,
    widthPercent = null,
    size = 18,
    italic = false,
    color = COLOR_TEXT_DARK,
  } = options;

  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            italic,
            color,
            size,
            font: 'Arial',
          }),
        ],
        alignment: align,
      }),
    ],
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    ...(widthPercent ? { width: { size: widthPercent, type: WidthType.PERCENTAGE } } : {}),
  });
}

function createMetricBox(title, value, subtitle, widthPercent) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 16,
            color: COLOR_SECONDARY,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spaceAfter: 40,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: value,
            bold: true,
            size: 32,
            color: COLOR_PRIMARY,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spaceAfter: 40,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle,
            italic: true,
            size: 15,
            color: COLOR_TEXT_MUTED,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
      left: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
      right: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
    },
    margins: { top: 140, bottom: 140, left: 120, right: 120 },
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
  });
}

export async function buildReport(reportData, outputPath) {
  const children = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: reportData.report_title || 'Resumen Ejecutivo: Reporte de Horas y Actividades de Soporte L3',
          bold: true,
          size: 30,
          color: COLOR_PRIMARY,
          font: 'Arial',
        }),
      ],
      spaceAfter: 100,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Proyecto: ', bold: true, color: COLOR_TEXT_DARK, size: 20, font: 'Arial' }),
        new TextRun({ text: `${reportData.project_name} (ID: ${reportData.project_id})`, bold: true, color: COLOR_SECONDARY, size: 20, font: 'Arial' }),
      ],
      spaceAfter: 40,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Período Auditado: ', bold: true, color: COLOR_TEXT_DARK, size: 18, font: 'Arial' }),
        new TextRun({
          text: `${reportData.period_str}  |  Fecha de Emisión: ${reportData.date_emission}`,
          color: COLOR_TEXT_MUTED,
          size: 18,
          font: 'Arial',
        }),
      ],
      spaceAfter: 200,
    })
  );

  // Metric Cards
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            createMetricBox('Total Horas', `${reportData.metrics.total_hours.toFixed(1)} hs`, 'Incurridas y registradas', 25),
            createMetricBox('Trackers Analizados', `${reportData.metrics.trackers_count} Tareas`, reportData.metrics.trackers_label, 25),
            createMetricBox('Imputaciones', `${reportData.metrics.entries_count} Registros`, 'Con detalle y justificación', 25),
            createMetricBox('Equipo Asignado', `${reportData.metrics.members_count} Especialistas`, reportData.metrics.members_label, 25),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '', spaceAfter: 240 })
  );

  // 1. Propósito y Alcance
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '1. Propósito y Alcance del Reporte', bold: true, size: 22, color: COLOR_PRIMARY, font: 'Arial' })],
      spaceAfter: 120,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'El presente documento brinda un resumen ejecutivo consolidado para el cliente respecto al consumo de horas registradas mediante el módulo ', size: 19, font: 'Arial' }),
        new TextRun({ text: 'Spent Time (Tiempo Invertido) ', bold: true, size: 19, font: 'Arial' }),
        new TextRun({ text: `de Redmine para el proyecto `, size: 19, font: 'Arial' }),
        new TextRun({ text: reportData.project_name, bold: true, color: COLOR_SECONDARY, size: 19, font: 'Arial' }),
        new TextRun({ text: `, focalizado en las tareas operativas e investigativas del período analizado:`, size: 19, font: 'Arial' }),
      ],
      spaceAfter: 80,
    })
  );

  for (const item of (reportData.purpose_items || [])) {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({ text: `${item.title}: `, bold: true }),
          new TextRun({ text: item.description }),
        ],
        spaceAfter: 60,
      })
    );
  }
  children.push(new Paragraph({ text: '', spaceAfter: 160 }));

  // 2. Consolidado por Profesional
  const memberRows = [
    new TableRow({
      children: [
        createHeaderCell('Profesional / Especialista', 25),
        createHeaderCell('Tracker Asociado', 20),
        createHeaderCell('Horas (hs)', 15),
        createHeaderCell('% Dedicación', 15),
        createHeaderCell('Foco Operativo / Técnico', 25),
      ],
    }),
  ];

  for (const m of reportData.members_breakdown) {
    memberRows.push(
      new TableRow({
        children: [
          createCell(m.name, { bold: true, widthPercent: 25 }),
          createCell(`Tarea #${m.tracker_id}`, { align: AlignmentType.CENTER, widthPercent: 20 }),
          createCell(`${m.hours.toFixed(1)} hs`, { align: AlignmentType.CENTER, bold: true, widthPercent: 15 }),
          createCell(`${m.percent.toFixed(1)} %`, { align: AlignmentType.CENTER, widthPercent: 15 }),
          createCell(m.focus, { widthPercent: 25 }),
        ],
      })
    );
  }

  memberRows.push(
    new TableRow({
      children: [
        createCell('TOTAL CONSOLIDADO', { bold: true, bg: COLOR_BG_HEADER, widthPercent: 25 }),
        createCell(`${reportData.metrics.trackers_count} Trackers`, { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_HEADER, widthPercent: 20 }),
        createCell(`${reportData.metrics.total_hours.toFixed(1)} hs`, { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_HEADER, color: COLOR_PRIMARY, widthPercent: 15, size: 20 }),
        createCell('100.0 %', { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_HEADER, widthPercent: 15 }),
        createCell(`${reportData.metrics.entries_count} Registros auditados`, { bold: true, bg: COLOR_BG_HEADER, widthPercent: 25 }),
      ],
    })
  );

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '2. Consolidado de Horas por Profesional', bold: true, size: 22, color: COLOR_PRIMARY, font: 'Arial' })],
      spaceAfter: 120,
    }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: memberRows }),
    new Paragraph({ text: '', spaceAfter: 240 })
  );

  // 3. Distribución por Tipología de Actividad + Gráfico Transparente
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '3. Distribución por Tipología de Actividad', bold: true, size: 22, color: COLOR_PRIMARY, font: 'Arial' })],
      spaceAfter: 120,
    })
  );

  if (reportData.chart_image_path && fs.existsSync(reportData.chart_image_path)) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: fs.readFileSync(reportData.chart_image_path),
            transformation: { width: 500, height: 341 },
          }),
        ],
        spaceBefore: 60,
        spaceAfter: 180,
      })
    );
  }

  const activityRows = [
    new TableRow({
      children: [
        createHeaderCell('Tipo de Actividad', 30),
        createHeaderCell('Horas Acumuladas', 20),
        createHeaderCell('% Participación', 20),
        createHeaderCell('Descripción / Justificación', 30),
      ],
    }),
  ];

  for (const act of reportData.activities_breakdown) {
    activityRows.push(
      new TableRow({
        children: [
          createCell(act.name, { bold: true, widthPercent: 30 }),
          createCell(`${act.hours.toFixed(1)} hs`, { align: AlignmentType.CENTER, bold: true, widthPercent: 20 }),
          createCell(`${act.percent.toFixed(1)} %`, { align: AlignmentType.CENTER, widthPercent: 20 }),
          createCell(act.description, { widthPercent: 30 }),
        ],
      })
    );
  }

  children.push(
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: activityRows }),
    new Paragraph({ text: '', spaceAfter: 240 })
  );

  // 4. Detalle Analítico y Cronológico de Actividades
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '4. Detalle Analítico y Cronológico de Actividades', bold: true, size: 22, color: COLOR_PRIMARY, font: 'Arial' })],
      spaceAfter: 120,
    })
  );

  for (let i = 0; i < reportData.trackers_details.length; i++) {
    const t = reportData.trackers_details[i];
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `4.${i+1} ${t.title}`, bold: true, size: 20, color: COLOR_SECONDARY, font: 'Arial' })],
        spaceAfter: 80,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Total de Horas: ${t.total_hours.toFixed(1)} hs | Estado: ${t.status} | Asignado: ${t.assigned_to}`,
            italic: true,
            color: COLOR_TEXT_MUTED,
            size: 18,
            font: 'Arial',
          }),
        ],
        spaceAfter: 80,
      })
    );

    const entryRows = [
      new TableRow({
        children: [
          createSubHeaderCell('Fecha', 14),
          createSubHeaderCell('Actividad', 16),
          createSubHeaderCell('Hs', 10),
          createSubHeaderCell('Detalle del Trabajo Técnico y Entregables', 60),
        ],
      }),
    ];

    for (const e of t.entries) {
      entryRows.push(
        new TableRow({
          children: [
            createCell(e.date, { align: AlignmentType.CENTER, widthPercent: 14 }),
            createCell(e.activity, { bold: true, widthPercent: 16 }),
            createCell(e.hours.toFixed(1), { align: AlignmentType.CENTER, bold: true, widthPercent: 10 }),
            createCell(e.description, { widthPercent: 60 }),
          ],
        })
      );
    }

    entryRows.push(
      new TableRow({
        children: [
          createCell(t.subtotal_label || 'SUBTOTAL', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 14 }),
          createCell(`${t.entries.length} Registros`, { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 16 }),
          createCell(`${t.total_hours.toFixed(1)} hs`, { bold: true, align: AlignmentType.CENTER, bg: COLOR_BG_LIGHT, color: COLOR_PRIMARY, widthPercent: 10 }),
          createCell(t.subtotal_desc || '', { bold: true, bg: COLOR_BG_LIGHT, widthPercent: 60 }),
        ],
      })
    );

    children.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: entryRows }),
      new Paragraph({ text: '', spaceAfter: 200 })
    );
  }

  // 5. Valor Aportado y Conclusiones
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '5. Valor Aportado y Conclusiones Ejecutivas', bold: true, size: 22, color: COLOR_PRIMARY, font: 'Arial' })],
      spaceAfter: 120,
    })
  );

  for (const c of (reportData.conclusions || [])) {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({ text: `${c.title}: `, bold: true }),
          new TextRun({ text: c.text }),
        ],
        spaceAfter: 80,
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Reporte generado automáticamente desde Redmine Agile MCP para el servicio de Soporte L3.',
          italic: true,
          size: 16,
          color: COLOR_TEXT_MUTED,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spaceBefore: 140,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document successfully built and saved to: ${outputPath}`);
}

async function main() {
  const jsonPath = process.argv[2];
  const outPath = process.argv[3];
  if (!jsonPath || !outPath) {
    console.error('Usage: node build_report.js <path_to_report_data.json> <output_docx_path>');
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  await buildReport(data, outPath);
}

if (process.argv[1] && process.argv[1].endsWith('build_report.js')) {
  main().catch((err) => {
    console.error('Error generating document:', err);
    process.exit(1);
  });
}
