import { get } from './redmineClient.js';
import fs from 'fs';

async function run() {
  try {
    const trackersData = await get('/trackers.json');
    console.log('Trackers:', trackersData.trackers.map(t => `${t.id}: ${t.name}`).join(', '));
  } catch(e) {
    console.error(e);
  }
}
run();
