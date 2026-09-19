import { get } from './redmineClient.js';
import fs from 'fs';

async function fetchAllIssues(projectId) {
  let offset = 0;
  const limit = 100;
  let allIssues = [];
  
  while (true) {
    const data = await get('/issues.json', { project_id: projectId, status_id: '*', limit, offset });
    if (!data.issues || data.issues.length === 0) break;
    allIssues = allIssues.concat(data.issues);
    if (data.issues.length < limit) break;
    offset += limit;
  }
  return allIssues;
}

async function run() {
  try {
    const projectId = 'rig-website-redesign-tareas1';
    
    // 1. Get Sprints
    const sprintsData = await get(`/projects/${projectId}/agile_sprints.json`);
    const sprints = sprintsData.agile_sprints || sprintsData.sprints || [];
    // Sort sprints by start_date
    sprints.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    console.log(`Loaded ${sprints.length} sprints`);
    
    // 2. Get all issues
    const allIssues = await fetchAllIssues(projectId);
    console.log(`Loaded ${allIssues.length} total issues`);
    
    const features = {};
    const taskToFeature = {};
    
    // Identify features
    for (const issue of allIssues) {
      if (issue.tracker && issue.tracker.id === 31) { // 31 = Feature
        features[issue.id] = issue.subject;
      }
    }
    
    // Identify tasks belonging to features
    const tasksToProcess = [];
    for (const issue of allIssues) {
      if (issue.parent && features[issue.parent.id]) {
        taskToFeature[issue.id] = features[issue.parent.id];
        tasksToProcess.push(issue.id);
      }
    }
    
    console.log(`Found ${Object.keys(features).length} features, ${tasksToProcess.length} tasks belonging to features.`);
    
    // 3. Process journals for tasks
    const tasksWithReviewing = [];
    let processed = 0;
    
    // Process in batches of 5 to not overwhelm the API
    for (let i = 0; i < tasksToProcess.length; i += 5) {
      const batch = tasksToProcess.slice(i, i + 5);
      const promises = batch.map(async (id) => {
        try {
          const detail = await get(`/issues/${id}.json`, { include: 'journals' });
          const journals = detail.issue.journals || [];
          let reviewingDate = null;
          
          for (const j of journals) {
            for (const d of j.details || []) {
              if (d.property === 'attr' && d.name === 'status_id' && String(d.new_value) === '66') {
                if (!reviewingDate || new Date(j.created_on) < new Date(reviewingDate)) {
                  reviewingDate = j.created_on;
                }
              }
            }
          }
          if (reviewingDate) {
             tasksWithReviewing.push({ id, feature: taskToFeature[id], reviewingDate });
          }
        } catch (err) {
          console.error(`Error fetching issue ${id}:`, err.message);
        }
      });
      await Promise.all(promises);
      processed += batch.length;
      if (processed % 20 === 0) console.log(`Processed ${processed}/${tasksToProcess.length} tasks`);
    }
    
    // 4. Map to sprints
    const sprintStats = {};
    for (const s of sprints) {
      sprintStats[s.name] = { sprint: s, features: {}, total: 0 };
    }
    
    function getSprintForDate(dateStr) {
      const date = new Date(dateStr);
      for (const s of sprints) {
        if (!s.start_date || !s.end_date) continue;
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);
        end.setHours(23, 59, 59, 999);
        if (date >= start && date <= end) return s.name;
      }
      return null;
    }
    
    for (const task of tasksWithReviewing) {
       const sprintName = getSprintForDate(task.reviewingDate);
       if (sprintName && sprintStats[sprintName]) {
          sprintStats[sprintName].total++;
          sprintStats[sprintName].features[task.feature] = (sprintStats[sprintName].features[task.feature] || 0) + 1;
       }
    }
    
    // 5. Generate Report
    let md = `# Velocidad SDLC Agéntico - Reporte de Throughput\n\n`;
    md += `El criterio de finalización de una tarea es su paso al estado **Reviewing**. Se han contabilizado las tareas hijas asignadas a *Features*.\n\n`;
    
    // Filter sprints (e.g. from Sprint 15 onwards)
    const activeSprints = sprints.filter(s => {
       const m = s.name.match(/Sprint (\d+)/);
       if (!m) return false;
       return parseInt(m[1]) >= 15 && parseInt(m[1]) <= 24;
    });
    
    md += `## Resumen por Sprint\n\n`;
    md += `| Sprint | Rango Fechas | Fase | Total Tareas a Reviewing | Detalle por Feature |\n`;
    md += `|---|---|---|---|---|\n`;
    
    let preTotal = 0; let preCount = 0;
    let postTotal = 0; let postCount = 0;
    
    for (const s of activeSprints) {
      const stat = sprintStats[s.name];
      const m = s.name.match(/Sprint (\d+)/);
      const isPost = m && parseInt(m[1]) >= 22; // Sprint 22 starts Aug 24
      
      const phase = isPost ? 'Post-Agéntico' : 'Pre-Agéntico';
      if (isPost) {
         postTotal += stat.total;
         postCount++;
      } else {
         preTotal += stat.total;
         preCount++;
      }
      
      const featureDetails = Object.entries(stat.features).map(([f, count]) => `${f}: **${count}**`).join('<br>');
      md += `| ${s.name} | ${s.start_date} / ${s.end_date} | ${phase} | **${stat.total}** | ${featureDetails || '-'} |\n`;
    }
    
    md += `\n## Comparativa de Velocidad\n\n`;
    md += `- **Velocidad Promedio Pre-Agéntico** (Sprints 15 a 21): **${(preTotal/preCount).toFixed(2)}** tareas / sprint\n`;
    md += `- **Velocidad Promedio Post-Agéntico** (Sprints 22 a 24): **${(postTotal/postCount).toFixed(2)}** tareas / sprint\n\n`;
    
    const increase = ((postTotal/postCount) - (preTotal/preCount)) / (preTotal/preCount) * 100;
    md += `*Variación de velocidad observada: **${increase > 0 ? '+' : ''}${increase.toFixed(2)}%***\n`;
    
    fs.writeFileSync('C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\7b63ca46-6bde-4c61-9445-7e522e66e43e\\velocity_report.md', md, 'utf8');
    console.log('Report generated at velocity_report.md');
    
  } catch(e) {
    console.error(e);
  }
}
run();
