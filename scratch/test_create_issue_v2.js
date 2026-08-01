import { post } from '../redmineClient.js';

async function testCreateIssue() {
  const issuePayload = {
    project_id: 452, 
    subject: 'Test Issue with custom_field_values',
    description: 'Testing custom_field_values creation',
    tracker_id: 45, // UserStory
    parent_issue_id: 37516,
    custom_field_values: {
      "64": "Test Intent",
      "49": "Test Criteria"
    }
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
