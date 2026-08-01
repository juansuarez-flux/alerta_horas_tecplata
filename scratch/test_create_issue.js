import { post } from '../redmineClient.js';

async function testCreateIssue() {
  const issuePayload = {
    project_id: 'rig-website-redesign-tareas1', // website-redesign-tareas
    subject: 'Test Issue with Custom Fields',
    description: 'Testing custom fields creation',
    tracker_id: 45, // UserStory
    parent_issue_id: 37516,
    custom_fields: [
      { id: 64, value: 'Test Intent' },
      { id: 49, value: 'Test Criteria' }
    ]
  };

  try {
    const data = await post('/issues.json', { issue: issuePayload });
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.redmineErrors) {
      console.error('Redmine Errors:', error.redmineErrors);
    }
  }
}

testCreateIssue();
