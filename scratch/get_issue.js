import { get } from '../redmineClient.js';

async function getIssueDetails(id) {
  try {
    const data = await get(`/issues/${id}.json`, { include: 'custom_fields' });
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getIssueDetails(37489);
