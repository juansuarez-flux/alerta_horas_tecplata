# Redmine Agile MCP Server

An **MCP (Model Context Protocol) server** that lets AI agents manage Redmine Agile projects — sprints, backlog, issues, and time tracking — through structured tools.

---

## CRUD Capabilities

This server provides comprehensive control over Redmine Agile issues:

*   **Create (C)**: Create new issues with sprint assignment, custom fields, and parent tasks using `create_issue`.
*   **Read (R)**: Retrieve sprints, issues, backlog, project members, spent time entries (`get_time_entries`), and advanced analytics.
*   **Update (U)**: Modify any standard issue field (assignee, priority, status, dates, parent, custom fields, etc.) using `update_issue`, or specific Agile actions like `move_issue_to_sprint` and `update_issue_status`.
*   **Delete (D)**: **Disabled** by design for security and to prevent accidental data loss through AI interactions.

---

## Prerequisites

- Node.js 18+
- Python 3.x *(required only for executive report generation via the Antigravity skill)*
- Redmine instance with the **Redmine Agile** plugin
- A Redmine API key with access to your project

---

## Setup

### 1. Clone / navigate to the project

```bash
cd mcp-redmine
```

### 2. Install dependencies

```bash
npm install
```

> **Note**: The project includes the `docx` library to support Word report generation scripts located in the `scratch/` folder.

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
copy .env.example .env
```

Edit `.env`:

```env
REDMINE_URL=https://your-redmine.example.com
REDMINE_API_KEY=your_api_key_here
```

---

## Execution

You can run the server using `npm` scripts defined in `package.json`:

```bash
# Standard execution
npm start

# Development mode (with auto-reload)
npm run dev
```

Alternatively, you can run it directly with Node.js:
```bash
node server.js
```

---

## Project Structure

```
mcp-redmine/
├── server.js            # MCP server entry point
├── redmineClient.js     # Reusable Redmine HTTP client
├── Manual de Usuario.docx # User Manual
├── tools/
│   ├── getSprints.js          # List all sprints
│   ├── getCurrentSprint.js    # Detect active sprint
│   ├── getSprintIssues.js     # Get issues in a sprint (inc. Parent Info)
│   ├── getBacklog.js          # Get backlog (inc. Parent Info)
│   ├── createIssue.js         # Create a new issue (inc. Sprint & Custom Fields)
│   ├── updateIssue.js         # Generic issue update (Standard Fields)
│   ├── getProjectMembers.js   # Find users in a project
│   ├── getTimeEntries.js      # Fetch logged time entries & spent hours
│   ├── generateExecutiveReport.js # Generate Word report (.docx) with activity chart
│   ├── moveIssueToSprint.js   # Move an issue to a specific sprint
│   ├── updateIssueStatus.js   # Quickly change issue status/notes
│   ├── sprintSummary.js       # Sprint stats (todo/doing/done)
│   ├── sprintHealth.js        # Sprint risk analysis
│   ├── planSprint.js          # Suggest items for next sprint
│   ├── burndown_data.js       # Story points analytics
│   ├── developer_workload.js  # Load per developer
│   ├── sprint_prediction.js   # Velocity and predictions
│   ├── sprintAnomalyDetection.js # Bottleneck detection
│   └── utils.js               # Project/Sprint/Issue resolution logic
├── scratch/             # Utility & development scripts (not part of the MCP server)
│   ├── generate_general_monthly_doc.js  # Generate monthly Word report
│   ├── generate_word_report.js          # Generate individual Word reports
│   ├── generate_unified_word_report.js  # Unified multi-tracker report
│   └── ...              # Analysis, testing, and exploration scripts
├── .agents/             # Antigravity IDE customizations
│   └── skills/
│       └── redmine-executive-report/    # Skill for automated executive reports
└── package.json         # Project configuration and scripts
```

---

## Available Tools

| Tool | Description | Status |
|------|-------------|--------|
| `get_sprints` | List all sprints for a project | ✅ Read |
| `get_current_sprint` | Detect active sprint by date | ✅ Read |
| `get_sprint_issues` | Get all issues in a sprint (includes Parent Task info) | ✅ Read |
| `get_backlog` | List issues not assigned to any sprint | ✅ Read |
| `create_issue` | Create a new Redmine issue | ✅ Create |
| `update_issue` | Update ANY standard field (assignee, priority, dates, etc.) | ✅ Update |
| `get_project_members` | List project members to find user IDs | ✅ Read |
| `get_time_entries` | Retrieve spent time entries (logged hours & comments) | ✅ Read |
| `get_executive_report_data` | Extract raw structured time & journal data for AI report synthesis | ✅ Read |
| `compile_executive_report_docx` | Compile AI-synthesized report data into Word document (.docx) | ✅ Create/Report |
| `move_issue_to_sprint` | Move an issue to a specific sprint | ✅ Update |
| `update_issue_status` | Change status and add notes quickly | ✅ Update |
| `sprint_summary` | Aggregate sprint stats by status | ✅ Read |
| `sprint_health` | Health score + risk analysis | ✅ Read |
| `plan_sprint` | Suggest backlog items for next sprint | ✅ Read |
| `burndown_data` | Calculate sprint story points | ✅ Read |
| `developer_workload` | View issue/point load per developer | ✅ Read |
| `sprint_prediction` | Estimate velocity and completion date | ✅ Read |
| `sprint_anomaly_detection` | Find unassigned, blocked, or large issues | ✅ Read |

---

## Advanced Features

### Parent Task Visibility
The tools `get_sprint_issues`, `get_backlog`, and `plan_sprint` automatically resolve and include the **Parent Task Subject** in their output. This provides immediate context for subtasks without requiring extra lookups.

### Robust ID Resolution
The server uses a smart resolution logic in `utils.js` that:
- Automatically maps project names/identifiers to internal **Numeric IDs**.
- Handles partial sprint name matches (e.g., "13" -> "Sprint 13").
- Ensures compatibility with Redmine Agile plugin filters (using `agile_sprints` technical filter).

### Time & Effort Tracking
The `get_time_entries` tool allows querying spent time logs for a project, specific issue, or team member across custom date ranges (`from` / `to`). It automatically resolves issue titles and calculates aggregate total hours logged.

---

## Tool Reference

### `create_issue`

Creates a new issue with optional sprint assignment and custom fields.

```json
{
  "project_id": "mi-proyecto",
  "subject": "Implementar módulo de reportes",
  "tracker_id": 2,
  "description": "Detalles sobre la tarea...",
  "assigned_to_id": 384,
  "estimated_hours": 8,
  "sprint_id": "Sprint 15",
  "parent_issue_id": 1020,
  "custom_fields": [
    { "id": 1, "value": "High Impact" }
  ]
}
```

### `update_issue`

Supports updating any of the following fields:
- `subject`, `description`
- `assigned_to_id` (Assign developer)
- `status_id`, `priority_id`, `tracker_id`, `category_id`, `fixed_version_id`
- `estimated_hours`, `done_ratio`
- `start_date`, `due_date`
- `sprint_id` (Resolved automatically)
- `parent_issue_id`
- `notes` (Add comment)

```json
{
  "issue_id": 1234,
  "assigned_to_id": 384,
  "priority_id": 3,
  "notes": "Moving this to high priority as per today's sync."
}
```

### `get_time_entries`

Retrieves spent time logs with optional issue, user, and date filtering:

```json
{
  "project_id": "mi-proyecto",
  "from": "2026-04-01",
  "to": "2026-04-30",
  "user_id": 384,
  "limit": 50
}
```

### `get_executive_report_data` & `compile_executive_report_docx` (Executive AI Pipeline)

This architecture leverages the native LLM intelligence of any MCP client (Claude Desktop, Cursor, Antigravity, etc.) to generate professional Word executive reports (`.docx`):

1. **`get_executive_report_data`**: Fetches and aggregates raw spent time, journal deltas, and task metadata for single or multiple projects across date ranges.
2. **AI LLM Synthesis**: The LLM analyzes raw developer comments, eliminates informal jargon, structures professional focus summaries per developer, activity breakdowns with concrete deliverables, and executive conclusions.
3. **`compile_executive_report_docx`**: Compiles the synthesized payload into the final formatted Word `.docx` document complete with transparent Python charts.

**Key Document Formatting & Layout Features:**
- **Single or Multi-Project Consolidation:** Consolidates one or multiple projects into a single unified report.
- **Dual Time Tracking:** Captures effort from both **Spent Time** (`spent_time`) and **Estimated Time** journal deltas (`estimated_hours`).
- **Executive Typography & Spacing:** Includes generous paragraph line-spacing (1.15x), clean table cell padding (140 twips top/bottom), and dynamic fallbacks preventing empty cells or generic static texts.

```json
// Step 1: Call get_executive_report_data
{
  "project_id": ["soporte-l3-2025-2026-requerimientos", "soporte-l3-2025-2026-tareas"],
  "from": "2026-09-01",
  "to": "2026-09-17"
}

// Step 2: Call compile_executive_report_docx with the LLM-synthesized payload
{
  "report_data": {
    "report_title": "Resumen Ejecutivo: Reporte de Horas y Actividades de Soporte L3",
    "project_name": "Consolidado: Soporte L3",
    "members_breakdown": [
      {
        "name": "Cristian Bova",
        "tracker_label": "3 Tareas (#39077, #39165, #39292)",
        "hours": 17.0,
        "percent": 75.6,
        "focus": "Certificados digitales, tokens, homologación FCE, validación EDI VERMAS..."
      }
    ],
    "activities_breakdown": [
      {
        "name": "Desarrollo y Soporte Técnico",
        "hours": 15.5,
        "percent": 68.9,
        "description": "Validación EDI VERMAS, correcciones Report PDF Billing N4 y revisión servicios de pesada."
      }
    ],
    "trackers_details": [...],
    "conclusions": [...]
  },
  "output_filename": "Resumen_Ejecutivo_Septiembre_2026.docx"
}
```

---

## Utility Scripts (`scratch/`)

The `scratch/` folder contains standalone Node.js scripts for development, analysis, and report generation. These scripts are **not part of the MCP server** but complement it:

| Script | Description |
|--------|-------------|
| `generate_general_monthly_doc.js` | Generates a monthly consolidated executive report in Word format |
| `generate_word_report.js` | Individual tracker Word report generator |
| `generate_unified_word_report.js` | Unified multi-tracker Word report generator |
| `generate_report_trackers_*.js` | Reports for specific tracker combinations |
| `analyze_sprint_*.js` | Sprint analysis scripts |
| `calculate_metrics.js` | Sprint metrics calculation |
| `get_time_entries.js` | Quick CLI for querying time entries |
| `test_*.js` | Integration and functional test scripts |

> These scripts use the `docx` library (included in `package.json`) and interact directly with the Redmine API via environment variables.

---

## Antigravity IDE Integration

The `.agents/skills/` folder contains a custom **Antigravity IDE skill** that automates executive report generation:

### `redmine-executive-report` Skill

Automates the creation of consolidated executive Word reports (`.docx`) from Redmine Spent Time entries. When triggered from Antigravity IDE, the skill:

1. Queries `get_time_entries` for specified issue IDs and date ranges.
2. Consolidates hours by developer and activity type (Development, Analysis, Diagnostics, Other).
3. Generates a transparent pie chart using a Python helper script.
4. Compiles a formatted `.docx` report using `build_report.js`.

**Output naming convention**: `Resumen_Ejecutivo_Horas_Soporte_<Mes>_<Año>.docx`

> This skill requires **Python 3.x** installed on the system for chart generation.

---

## Automated Executive Hour Limit Email Alerts (`scripts/checkHourLimitAlert.js`)

The project includes an automated daily monitoring script designed to run via **GitHub Actions** (`.github/workflows/hour-limit-alert.yml`):

- **Purpose:** Monitors monthly hours consumption for Soporte L3 (`Requerimientos` + `Tareas`).
- **Threshold Alerts:** Triggers HTML email alerts when reaching defined thresholds (e.g. `40hs` and `45hs` out of a `50hs` monthly limit).
- **Executive HTML Format:** Sends an HTML email featuring:
  - **Métricas Generales:** Total hours, items worked, professionals involved.
  - **Distribución por Profesional:** Breakdown table with hours and dedication percentages.
  - **Distribución por Actividad:** Breakdown table by activity type.
  - **Ítems Destacados:** Highlighted list of tasks, current status, hours, and clean progress notes.
- **Manual Trigger:** Supports `--force` flag to send executive email reports on demand (e.g., `node scripts/checkHourLimitAlert.js --force`).

---

## MCP Client Configuration

Standard MCP configuration applies for Claude Desktop, Cursor, and Antigravity. Refer to the specific client documentation for adding the server via `node server.js`.

---

## Redmine Agile API Notes

- **Filter Logic**: Uses `f[]=agile_sprints` with numeric project IDs to ensure strict filtering in Agile boards.
- **Hierarchies**: Parent-child relationships are fetched via extended issue subjects for bulk operations.
- **Safety**: No deletion tools are implemented to protect project integrity.
