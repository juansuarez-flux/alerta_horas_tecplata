/**
 * redmineClient.js
 * Reusable HTTP client for the Redmine REST API.
 * Reads REDMINE_URL and REDMINE_API_KEY from environment variables.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Intercept console.log to prevent dotenv from polluting stdout (which breaks MCP JSON-RPC)
const _log = console.log;
console.log = function() {};
dotenv.config({ path: join(__dirname, '.env') });
console.log = _log;

const REDMINE_URL = process.env.REDMINE_URL;
const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

if (!REDMINE_URL) {
  throw new Error('Missing environment variable: REDMINE_URL');
}
if (!REDMINE_API_KEY) {
  throw new Error('Missing environment variable: REDMINE_API_KEY');
}

const client = axios.create({
  baseURL: REDMINE_URL.replace(/\/$/, ''), // strip trailing slash
  headers: {
    'X-Redmine-API-Key': REDMINE_API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

/**
 * Perform a GET request to the Redmine API.
 * @param {string} path - API path (e.g. '/issues.json')
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Parsed JSON response data
 */
export async function get(path, params = {}) {
  try {
    const response = await client.get(path, { params });
    return response.data;
  } catch (error) {
    throw formatError(error);
  }
}

/**
 * Perform a POST request to the Redmine API.
 * @param {string} path - API path
 * @param {object} body - Request body
 * @returns {Promise<object>} Parsed JSON response data
 */
export async function post(path, body = {}) {
  try {
    const response = await client.post(path, body);
    return response.data;
  } catch (error) {
    throw formatError(error);
  }
}

/**
 * Perform a PUT request to the Redmine API.
 * @param {string} path - API path
 * @param {object} body - Request body
 * @returns {Promise<object>} Parsed JSON response data (Redmine PUT returns 200 or 204)
 */
export async function put(path, body = {}) {
  try {
    const response = await client.put(path, body);
    // Redmine returns 200 with body or 204 with empty body
    return response.data || { success: true };
  } catch (error) {
    throw formatError(error);
  }
}

/**
 * Format axios errors into a consistent error object.
 */
function formatError(error) {
  if (error.response) {
    const { status, data } = error.response;
    const messages =
      data?.errors?.join(', ') ||
      data?.error ||
      `HTTP ${status}`;
    const err = new Error(`Redmine API error: ${messages}`);
    err.statusCode = status;
    err.redmineErrors = data?.errors;
    return err;
  }
  if (error.request) {
    const err = new Error(`Redmine API unreachable: ${error.message}`);
    err.code = 'NETWORK_ERROR';
    return err;
  }
  return error;
}
