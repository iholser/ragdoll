import { test, expect } from '@playwright/test';
import { ApiTestHelper, TestDataGenerator } from './utils/api-helpers';

test.describe('Chat Runtime API Routes', () => {
  let apiHelper: ApiTestHelper;
  let organizationId: string;
  let userId: string;
  let authToken: string;
  let agentId: string;
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    apiHelper = new ApiTestHelper(request);
    
    // Create test organization
    const orgData = TestDataGenerator.generateOrganization();
    organizationId = await apiHelper.createOrganization(orgData);

    // Create and login test user
    const userData = TestDataGenerator.generateUser(organizationId);
    userId = await apiHelper.registerUser(userData);
    const tokens = await apiHelper.loginUser(userData.email, userData.password);
    authToken = tokens.accessToken;

    // Create test agent
    const agentData = TestDataGenerator.generateAgent(organizationId);
    agentId = await apiHelper.createAgent(authToken, agentData);
  });

  test.beforeEach(async () => {
    // Create a new session for each test
    const sessionData = {
      agentId,
      metadata: {
        source: 'e2e-test',
        userAgent: 'playwright-test'
      }
    };
    sessionId = await apiHelper.createSession(authToken, sessionData);
  });

  test('should process chat message successfully', async ({ request }) => {
    const messageData = TestDataGenerator.generateChatMessage(sessionId);

    const response = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: messageData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBeDefined();
    expect(data.data.response).toBeDefined();
    expect(data.data.sessionId).toBe(sessionId);
    expect(data.data.conversationId).toBeDefined();
  });

  test('should reject chat message without authentication', async ({ request }) => {
    const messageData = TestDataGenerator.generateChatMessage(sessionId);

    const response = await request.post('/api/runtime/chat', {
      data: messageData
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  test('should reject chat message with invalid session', async ({ request }) => {
    const messageData = {
      sessionId: 'invalid-session-id',
      message: 'Test message',
      metadata: {}
    };

    const response = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: messageData
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('session');
  });

  test('should reject empty chat message', async ({ request }) => {
    const messageData = {
      sessionId,
      message: '',
      metadata: {}
    };

    const response = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: messageData
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('message');
  });

  test('should handle chat message with context retrieval', async ({ request }) => {
    // First upload a document to provide context
    const documentData = TestDataGenerator.generateDocument(organizationId);
    const documentId = await apiHelper.uploadDocument(authToken, documentData);

    // Send a message that should trigger context retrieval
    const messageData = {
      sessionId,
      message: 'Can you help me with documentation?',
      metadata: {
        includeContext: true
      }
    };

    const response = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: messageData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.context).toBeDefined();
    expect(data.data.context.sources).toBeDefined();
  });

  test('should maintain conversation context across messages', async ({ request }) => {
    // Send first message
    const firstMessage = {
      sessionId,
      message: 'My name is John and I need help',
      metadata: {}
    };

    const firstResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: firstMessage
    });

    expect(firstResponse.ok()).toBeTruthy();
    const firstData = await firstResponse.json();
    const conversationId = firstData.data.conversationId;

    // Send follow-up message
    const secondMessage = {
      sessionId,
      message: 'What is my name?',
      metadata: {}
    };

    const secondResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: secondMessage
    });

    expect(secondResponse.ok()).toBeTruthy();
    const secondData = await secondResponse.json();
    expect(secondData.data.conversationId).toBe(conversationId);
    expect(secondData.data.response).toContain('John');
  });

  test('should handle chat message with action evaluation', async ({ request }) => {
    const messageData = {
      sessionId,
      message: 'I want to schedule a meeting for tomorrow at 2 PM',
      metadata: {
        enableActions: true
      }
    };

    const response = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: messageData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.actions).toBeDefined();
    expect(Array.isArray(data.data.actions)).toBe(true);
  });

  test('should return conversation history', async ({ request }) => {
    // Send a few messages first
    for (let i = 0; i < 3; i++) {
      const messageData = {
        sessionId,
        message: `Test message ${i + 1}`,
        metadata: {}
      };

      await request.post('/api/runtime/chat', {
        headers: apiHelper.getAuthHeaders(authToken),
        data: messageData
      });
    }

    // Get conversation history
    const response = await request.get(`/api/runtime/conversations/${sessionId}/history`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.messages)).toBe(true);
    expect(data.data.messages.length).toBeGreaterThanOrEqual(6); // 3 user messages + 3 assistant responses
  });

  test('should handle rate limiting appropriately', async ({ request }) => {
    // Send multiple rapid requests
    const promises = Array(10).fill(null).map(async (_, i) => {
      const messageData = {
        sessionId,
        message: `Rapid message ${i}`,
        metadata: {}
      };

      return request.post('/api/runtime/chat', {
        headers: apiHelper.getAuthHeaders(authToken),
        data: messageData
      });
    });

    const responses = await Promise.all(promises);
    
    // At least some should succeed
    const successfulResponses = responses.filter(r => r.ok());
    expect(successfulResponses.length).toBeGreaterThan(0);

    // Some might be rate limited (429) - this is acceptable
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    // We don't assert on rate limiting as it depends on configuration
  });

  test.afterEach(async () => {
    // Clean up session after each test
    if (sessionId) {
      await apiHelper.cleanup(authToken, { sessionIds: [sessionId] });
    }
  });

  test.afterAll(async () => {
    // Clean up all test data
    if (authToken && agentId) {
      await apiHelper.cleanup(authToken, { 
        agentIds: [agentId],
        organizationId,
        userId
      });
    }
  });
});
