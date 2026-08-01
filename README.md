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

---

## MCP Client Configuration

Standard MCP configuration applies for Claude Desktop, Cursor, and Antigravity. Refer to the specific client documentation for adding the server via `node server.js`.

---

## Redmine Agile API Notes

- **Filter Logic**: Uses `f[]=agile_sprints` with numeric project IDs to ensure strict filtering in Agile boards.
- **Hierarchies**: Parent-child relationships are fetched via extended issue subjects for bulk operations.
- **Safety**: No deletion tools are implemented to protect project integrity.

