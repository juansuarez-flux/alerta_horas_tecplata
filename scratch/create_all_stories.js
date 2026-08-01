import { post } from '../redmineClient.js';

const stories = [
  {
    subject: '[Backend] - Public API Service Base Setup',
    description: 'As a Backend Developer, I need to set up the base structure of the Public API service so that it can handle incoming requests, route them correctly, and integrate with the internal API v2. This includes defining the project structure, controllers, routing configuration, and the request processing pipeline where input mappers, middleware, and output mappers will be executed in sequence.'
  },
  {
    subject: '[Backend] - Public Endpoints Definition and Exposure',
    description: 'As a Backend Developer, I need to define and implement the public endpoints of the API so that external clients can interact with the system using the expected routes. This includes configuring endpoints such as GET /policy/{id} and PATCH /policy/{id}, ensuring they are correctly routed and prepared to process incoming requests through the defined flow.'
  },
  {
    subject: '[Backend] - Input Mapper Implementation',
    description: 'As a Backend Developer, I need to implement an input mapper that transforms incoming external requests into the format required by the internal API v2, ensuring that differences in structure, field naming, and data formats are properly handled without modifying the internal services.'
  },
  {
    subject: '[Backend] - ID Resolution Middleware Implementation',
    description: 'As a Backend Developer, I need to implement a middleware component that intercepts incoming requests and determines whether the provided identifier corresponds to a Coverage ID or a Policy ID. If a Coverage ID is detected, the middleware must resolve it by calling the /policies endpoint to retrieve the corresponding Policy ID before forwarding the request to the internal API v2.'
  },
  {
    subject: '[Backend] - Internal API v2 Client Integration',
    description: 'As a Backend Developer, I need to implement the integration layer that allows the Public API to communicate with the internal API v2, including handling requests, responses, and potential communication errors between both services.'
  },
  {
    subject: '[Backend] - Output Mapper Implementation',
    description: 'As a Backend Developer, I need to implement an output mapper that transforms the responses received from the internal API v2 into the format expected by external clients, ensuring consistency and abstraction of internal structures.'
  },
  {
    subject: '[Backend] - End-to-End Request Flow Integration',
    description: 'As a Backend Developer, I need to integrate the full request flow so that incoming requests pass through the input mapper, ID resolution middleware, internal API v2, and output mapper, ensuring a seamless and consistent processing pipeline from external client to response.'
  },
  {
    subject: '[Backend] - Error Handling Standardization',
    description: 'As a Backend Developer, I need to define and implement a standardized error handling mechanism so that all errors occurring across the request lifecycle (mapper, middleware, integration with API v2) are consistently formatted and returned to the client.'
  },
  {
    subject: '[Backend] - Integration Testing of Public API Flow',
    description: 'As a Backend Developer, I need to validate the complete flow of the Public API by executing integration tests that cover scenarios with both Coverage ID resolution and direct Policy ID usage, ensuring correct behavior across all components.'
  },
  {
    subject: '[Backend] - Middleware Scope Configuration',
    description: 'As a Backend Developer, I need to configure the middleware so that it can be applied selectively to specific endpoints, allowing flexibility based on the final decision regarding where ID resolution is required.'
  }
];

async function createStories() {
  const results = [];
  for (const story of stories) {
    const payload = {
      project_id: 452,
      subject: story.subject,
      description: story.description,
      tracker_id: 45, // UserStory
      parent_issue_id: 37516,
      custom_fields: [
        { id: 64, value: 'N/A' },
        { id: 49, value: story.description }
      ]
    };

    try {
      const data = await post('/issues.json', { issue: payload });
      results.push({ subject: story.subject, id: data.issue.id, success: true });
      console.log(`Created: ${story.subject} (ID: ${data.issue.id})`);
    } catch (error) {
      console.error(`Error creating ${story.subject}:`, error.message);
      if (error.redmineErrors) {
        console.error('Redmine Errors:', error.redmineErrors);
      }
      results.push({ subject: story.subject, success: false, error: error.message });
    }
  }
  console.log('Final Results:', JSON.stringify(results, null, 2));
}

createStories();
