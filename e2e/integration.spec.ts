import { test, expect } from '@playwright/test';
import { ApiTestHelper, TestDataGenerator } from './utils/api-helpers';

test.describe('Full Workflow Integration Tests', () => {
  let apiHelper: ApiTestHelper;
  let organizationId: string;
  let userId: string;
  let authToken: string;
  let agentId: string;
  let documentId: string;
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    apiHelper = new ApiTestHelper(request);
    
    // 1. Create organization
    const orgData = TestDataGenerator.generateOrganization();
    organizationId = await apiHelper.createOrganization(orgData);

    // 2. Register and login user
    const userData = TestDataGenerator.generateUser(organizationId);
    userId = await apiHelper.registerUser(userData);
    const tokens = await apiHelper.loginUser(userData.email, userData.password);
    authToken = tokens.accessToken;

    // 3. Create agent
    const agentData = TestDataGenerator.generateAgent(organizationId);
    agentId = await apiHelper.createAgent(authToken, agentData);

    // 4. Upload knowledge base document
    const documentData = TestDataGenerator.generateDocument(organizationId);
    documentId = await apiHelper.uploadDocument(authToken, documentData);

    // 5. Create session
    const sessionData = {
      agentId,
      metadata: {
        source: 'integration-test',
        userAgent: 'playwright-test'
      }
    };
    sessionId = await apiHelper.createSession(authToken, sessionData);
  });

  test('should complete full customer service workflow', async ({ request }) => {
    // Step 1: Customer starts conversation with greeting
    const greetingMessage = {
      sessionId,
      message: 'Hello, I need help with my account',
      metadata: { source: 'integration-test' }
    };

    const greetingResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: greetingMessage
    });

    expect(greetingResponse.ok()).toBeTruthy();
    const greetingData = await greetingResponse.json();
    expect(greetingData.success).toBe(true);
    expect(greetingData.data.response).toBeDefined();
    const conversationId = greetingData.data.conversationId;

    // Step 2: Customer asks specific question that should trigger knowledge base lookup
    const questionMessage = {
      sessionId,
      message: 'Can you help me understand the documentation about project management?',
      metadata: { includeContext: true }
    };

    const questionResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: questionMessage
    });

    expect(questionResponse.ok()).toBeTruthy();
    const questionData = await questionResponse.json();
    expect(questionData.success).toBe(true);
    expect(questionData.data.context).toBeDefined();
    expect(questionData.data.context.sources).toBeDefined();

    // Step 3: Customer requests an action (scheduling)
    const actionMessage = {
      sessionId,
      message: 'I need to schedule a callback for tomorrow at 3 PM',
      metadata: { enableActions: true }
    };

    const actionResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: actionMessage
    });

    expect(actionResponse.ok()).toBeTruthy();
    const actionData = await actionResponse.json();
    expect(actionData.success).toBe(true);
    expect(actionData.data.actions).toBeDefined();
    expect(Array.isArray(actionData.data.actions)).toBe(true);

    // Step 4: Verify conversation history
    const historyResponse = await request.get(`/api/runtime/conversations/${sessionId}/history`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(historyResponse.ok()).toBeTruthy();
    const historyData = await historyResponse.json();
    expect(historyData.success).toBe(true);
    expect(historyData.data.messages.length).toBeGreaterThanOrEqual(6); // 3 user + 3 assistant messages
    expect(historyData.data.conversationId).toBe(conversationId);

    // Step 5: Customer ends conversation
    const endMessage = {
      sessionId,
      message: 'Thank you for your help!',
      metadata: { conversationEnd: true }
    };

    const endResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: endMessage
    });

    expect(endResponse.ok()).toBeTruthy();
    const endData = await endResponse.json();
    expect(endData.success).toBe(true);
  });

  test('should handle agent knowledge update workflow', async ({ request }) => {
    // Step 1: Upload new document to knowledge base
    const newDocumentData = {
      title: 'Updated Knowledge Base Document',
      content: 'This document contains updated information about our new product features and support procedures.',
      organizationId,
      metadata: {
        type: 'knowledge-update',
        version: '2.0',
        processForRAG: true
      }
    };

    const uploadResponse = await request.post('/api/documents', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: newDocumentData
    });

    expect(uploadResponse.ok()).toBeTruthy();
    const uploadData = await uploadResponse.json();
    const newDocumentId = uploadData.data.id;

    // Step 2: Verify document is processed for RAG
    const chunksResponse = await request.get(`/api/documents/${newDocumentId}/chunks`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(chunksResponse.ok()).toBeTruthy();
    const chunksData = await chunksResponse.json();
    expect(chunksData.success).toBe(true);
    expect(chunksData.data.chunks.length).toBeGreaterThan(0);

    // Step 3: Test that agent can access new knowledge
    const knowledgeTestMessage = {
      sessionId,
      message: 'Tell me about the new product features',
      metadata: { includeContext: true }
    };

    const knowledgeResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: knowledgeTestMessage
    });

    expect(knowledgeResponse.ok()).toBeTruthy();
    const knowledgeData = await knowledgeResponse.json();
    expect(knowledgeData.success).toBe(true);
    expect(knowledgeData.data.context.sources.length).toBeGreaterThan(0);

    // Clean up new document
    await request.delete(`/api/documents/${newDocumentId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });
  });

  test('should handle multi-user organization workflow', async ({ request }) => {
    // Step 1: Create second user in the same organization
    const secondUserData = TestDataGenerator.generateUser(organizationId);
    const secondUserId = await apiHelper.registerUser(secondUserData);
    const secondUserTokens = await apiHelper.loginUser(secondUserData.email, secondUserData.password);

    // Step 2: Second user creates their own agent
    const secondAgentData = TestDataGenerator.generateAgent(organizationId);
    const secondAgentResponse = await request.post('/api/agents', {
      headers: apiHelper.getAuthHeaders(secondUserTokens.accessToken),
      data: secondAgentData
    });

    expect(secondAgentResponse.ok()).toBeTruthy();
    const secondAgentId = (await secondAgentResponse.json()).data.id;

    // Step 3: Verify both users can see organization documents
    const firstUserDocsResponse = await request.get('/api/documents', {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    const secondUserDocsResponse = await request.get('/api/documents', {
      headers: apiHelper.getAuthHeaders(secondUserTokens.accessToken)
    });

    expect(firstUserDocsResponse.ok()).toBeTruthy();
    expect(secondUserDocsResponse.ok()).toBeTruthy();

    const firstUserDocs = (await firstUserDocsResponse.json()).data.documents;
    const secondUserDocs = (await secondUserDocsResponse.json()).data.documents;

    // Both users should see the same organization documents
    expect(firstUserDocs.length).toBe(secondUserDocs.length);

    // Step 4: Verify organization user listing
    const orgUsersResponse = await request.get(`/api/organizations/${organizationId}/users`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(orgUsersResponse.ok()).toBeTruthy();
    const orgUsers = (await orgUsersResponse.json()).data.users;
    expect(orgUsers.length).toBeGreaterThanOrEqual(2);

    const userIds = orgUsers.map((u: any) => u.id);
    expect(userIds).toContain(userId);
    expect(userIds).toContain(secondUserId);

    // Clean up second agent
    await request.delete(`/api/agents/${secondAgentId}`, {
      headers: apiHelper.getAuthHeaders(secondUserTokens.accessToken)
    });
  });

  test('should handle error recovery and resilience', async ({ request }) => {
    // Step 1: Test recovery from invalid session
    const invalidSessionMessage = {
      sessionId: 'invalid-session-id',
      message: 'Test message with invalid session',
      metadata: {}
    };

    const invalidSessionResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: invalidSessionMessage
    });

    expect(invalidSessionResponse.status()).toBe(404);

    // Step 2: Test recovery from service unavailability (e.g., ChromaDB down)
    // This should gracefully degrade and still provide response without context
    const gracefulDegradeMessage = {
      sessionId,
      message: 'This should work even if RAG service is unavailable',
      metadata: { includeContext: true, allowGracefulDegradation: true }
    };

    const gracefulResponse = await request.post('/api/runtime/chat', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: gracefulDegradeMessage
    });

    expect(gracefulResponse.ok()).toBeTruthy();
    const gracefulData = await gracefulResponse.json();
    expect(gracefulData.success).toBe(true);
    expect(gracefulData.data.response).toBeDefined();

    // Step 3: Test token refresh workflow
    // Note: This would require actual token expiration testing
    // For now, we'll test the refresh endpoint directly
    const refreshResponse = await request.post('/api/auth/refresh', {
      data: { refreshToken: 'test-refresh-token' }
    });

    // This should fail with invalid token, but endpoint should be available
    expect(refreshResponse.status()).toBe(401);
  });

  test.afterAll(async () => {
    // Clean up all test resources
    if (authToken) {
      await apiHelper.cleanup(authToken, {
        sessionIds: [sessionId],
        agentIds: [agentId],
        documentIds: [documentId],
        organizationId,
        userId
      });
    }
  });
});
