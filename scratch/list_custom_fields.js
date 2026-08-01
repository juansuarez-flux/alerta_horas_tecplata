import { get } from '../redmineClient.js';

async function listCustomFields() {
  try {
    const data = await get('/custom_fields.json');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listCustomFields();
