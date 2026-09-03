---
name: redmine-executive-report
description: >-
  Generate executive summary reports in Word (.docx) format with transparent activity distribution charts
  from Redmine Spent Time entries, tasks, or trackers. Use this skill whenever the user asks to create,
  generate, or update an executive report (resumen ejecutivo) of spent hours, time entries, or support
  trackers for specific Redmine task IDs.
---

# Redmine Executive Report Skill

Esta skill automatiza la generación de un informe ejecutivo consolidado en formato Word (`.docx`) para presentarle al cliente, a partir de las horas registradas en **Spent Time (Tiempo Invertido)** de una o más tareas/trackers de Redmine.

## Flujo de Ejecución Paso a Paso

### Paso 1: Parsear Entradas del Usuario
1. **Identificar Tareas/Trackers**: Extraer los IDs numéricos de las tareas provistas por el usuario (ej: `39077, 38818`).
2. **Filtro de Fechas Opcional**: Detectar si el usuario especificó un rango o mes (`from`/`to` en formato `YYYY-MM-DD` o nombres de mes como "Agosto 2026"). Si no se especifica fecha, se evalúan todas las horas del tracker.

### Paso 2: Extraer Horas y Notas Técnicas de Redmine
1. **Obtener Imputaciones de Tiempo**:
   - Llamar a la herramienta MCP `get_time_entries` con el `project_id` y cada `issue_id` (aplicando filtros `from` y `to` si fueron definidos).
   - Extraer `hours`, `spent_on`, `activity_name`, `user_name`, `comments` de cada registro.
2. **Consultar Notas y Minutas (Journals)**:
   - Consultar `/issues/<id>.json?include=journals` para correlacionar la hora exacta de imputación con las notas técnicas que el desarrollador dejó al registrar el tiempo o cambiar de estado.
   - Rescatar adjuntos relevantes (diagramas de flujo, capturas, diagramas de secuencia).

### Paso 3: Consolidar Métricas y Categorías
1. **Por Profesional**:
   - Total de horas por integrante, porcentaje sobre el total (`horas / total * 100`) y resumen de su foco técnico.
2. **Por Tipología de Actividad** (según convención estándar de Redmine):
   - **Diagnóstico y Verificaciones** (*Diagnosis*): Pruebas de QA, análisis de contratos, revisiones de ambiente.
   - **Desarrollo y Soporte Técnico** (*Development*): Implementaciones, certificados digitales, configuraciones técnicas.
   - **Análisis e Investigación** (*Analysis*): Definición de arquitectura, endpoints, estrategia PAPI/Navigate, tokens.
   - **Monitoreo y Reuniones** (*Other*): Sesiones de alineación con líderes, arquitectos y equipo.
3. **Totales Globales**:
   - Horas totales, cantidad de registros, cantidad de tareas y profesionales participantes.

### Paso 4: Generar Gráfico de Torta con Fondo Transparente
Ejecutar el script auxiliar en Python que crea la torta con fondo transparente:
```bash
python <skill_dir>/scripts/generate_chart.py \
  --hours "<h_diag>,<h_dev>,<h_anal>,<h_other>" \
  --labels "Diagnóstico y Verificaciones,Desarrollo y Soporte Técnico,Análisis e Investigación,Monitoreo y Reuniones" \
  --output "<workspace_or_temp>/activity_distribution_chart.png" \
  --total <total_hours> \
  --subtitle "Distribución General de Horas por Actividad (<total_hours> hs)"
```

### Paso 5: Compilar el Documento Word (.docx)
1. Guardar los datos estructurados en un archivo JSON temporal con la estructura requerida por `build_report.js`.
2. Ejecutar el compilador `build_report.js`:
```bash
node <skill_dir>/scripts/build_report.js <temp_data.json> <output_dir>/Resumen_Ejecutivo_Horas_Soporte_<Mes>_<Año>.docx
```
El nombre por defecto sigue la regla: `Resumen_Ejecutivo_Horas_Soporte_<Mes>_<Año>.docx`.

### Paso 6: Entregar el Resultado al Usuario
1. Devolver el enlace directo en formato markdown al archivo Word:
   `[Resumen_Ejecutivo_Horas_Soporte_<Mes>_<Año>.docx](file:///path/to/file)`
2. Presentar una tabla ejecutiva resumen con:
   - Horas totales y cantidad de registros.
   - Desglose por profesional con porcentajes.
   - Resumen de valor técnico aportado al cliente.
