import { get } from '../redmineClient.js';

async function listTrackers() {
  try {
    const data = await get('/trackers.json');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listTrackers();
