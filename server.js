/**
 * server.js
 * Redmine Agile MCP Server - Entry Point
 *
 * Registers all Redmine Agile tools and exposes them via the
 * Model Context Protocol using stdio transport.
 *
 * Usage:
 *   REDMINE_URL=https://your-redmine.example.com \
 *   REDMINE_API_KEY=your_api_key \
 *   node server.js
 */


import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import all tools
import * as getSprints from './tools/getSprints.js';
import * as getCurrentSprint from './tools/getCurrentSprint.js';
import * as getSprintIssues from './tools/getSprintIssues.js';
import * as getBacklog from './tools/getBacklog.js';
import * as createIssue from './tools/createIssue.js';
import * as moveIssueToSprint from './tools/moveIssueToSprint.js';
import * as updateIssueStatus from './tools/updateIssueStatus.js';
import * as sprintSummary from './tools/sprintSummary.js';
import * as sprintHealth from './tools/sprintHealth.js';
import * as planSprint from './tools/planSprint.js';
import * as updateIssue from './tools/updateIssue.js';
import * as getProjectMembers from './tools/getProjectMembers.js';
import * as getTimeEntries from './tools/getTimeEntries.js';


// New advanced tools
import * as burndownData from './tools/burndown_data.js';
import * as developerWorkload from './tools/developer_workload.js';
import * as sprintPrediction from './tools/sprint_prediction.js';
import * as sprintAnomalyDetection from './tools/sprintAnomalyDetection.js';

// Registry: map tool name -> handler function
const TOOLS = [
  getSprints,
  getCurrentSprint,
  getSprintIssues,
  getBacklog,
  createIssue,
  moveIssueToSprint,
  updateIssueStatus,
  sprintSummary,
  sprintHealth,
  planSprint,
  burndownData,
  developerWorkload,
  sprintPrediction,
  sprintAnomalyDetection,
  updateIssue,
  getProjectMembers,
  getTimeEntries,
];

const toolMap = new Map(TOOLS.map((t) => [t.definition.name, t.handler]));
const toolDefinitions = TOOLS.map((t) => t.definition);

// Create MCP server
const server = new Server(
  {
    name: 'redmine-agile-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: toolDefinitions };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolMap.get(name);
  if (!handler) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Unknown tool: "${name}"`,
            available_tools: [...toolMap.keys()],
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await handler(args ?? {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    const errorPayload = {
      error: err.message,
      ...(err.statusCode && { http_status: err.statusCode }),
      ...(err.redmineErrors && { redmine_errors: err.redmineErrors }),
      ...(err.code && { code: err.code }),
    };
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorPayload),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[redmine-agile-mcp] Server started and listening via stdio.');
}

main().catch((err) => {
  console.error('[redmine-agile-mcp] Fatal error:', err);
  process.exit(1);
});
