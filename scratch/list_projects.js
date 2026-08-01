import { get } from '../redmineClient.js';

async function listProjects() {
  try {
    const data = await get('/projects.json');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listProjects();
