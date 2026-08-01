import { get } from '../redmineClient.js';

async function listIssues() {
  try {
    const data = await get('/issues.json', { limit: 1 });
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listIssues();
