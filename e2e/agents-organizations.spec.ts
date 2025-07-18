import { test, expect } from '@playwright/test';
import { ApiTestHelper, TestDataGenerator } from './utils/api-helpers';

test.describe('Agents API Routes', () => {
  let apiHelper: ApiTestHelper;
  let organizationId: string;
  let authToken: string;
  let agentIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    apiHelper = new ApiTestHelper(request);
    
    // Create test organization and user
    const orgData = TestDataGenerator.generateOrganization();
    organizationId = await apiHelper.createOrganization(orgData);

    const userData = TestDataGenerator.generateUser(organizationId);
    await apiHelper.registerUser(userData);
    const tokens = await apiHelper.loginUser(userData.email, userData.password);
    authToken = tokens.accessToken;
  });

  test('should create agent successfully', async ({ request }) => {
    const agentData = TestDataGenerator.generateAgent(organizationId);

    const response = await request.post('/api/agents', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: agentData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.name).toBe(agentData.name);
    expect(data.data.organizationId).toBe(organizationId);
    
    agentIds.push(data.data.id);
  });

  test('should list agents for organization', async ({ request }) => {
    // Create a couple of agents first
    const agent1Data = TestDataGenerator.generateAgent(organizationId);
    const agent2Data = TestDataGenerator.generateAgent(organizationId);

    const agent1Id = await apiHelper.createAgent(authToken, agent1Data);
    const agent2Id = await apiHelper.createAgent(authToken, agent2Data);
    agentIds.push(agent1Id, agent2Id);

    const response = await request.get('/api/agents', {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.agents)).toBe(true);
    expect(data.data.agents.length).toBeGreaterThanOrEqual(2);
    
    const agentNames = data.data.agents.map((a: any) => a.name);
    expect(agentNames).toContain(agent1Data.name);
    expect(agentNames).toContain(agent2Data.name);
  });

  test('should get agent by ID', async ({ request }) => {
    const agentData = TestDataGenerator.generateAgent(organizationId);
    const agentId = await apiHelper.createAgent(authToken, agentData);
    agentIds.push(agentId);

    const response = await request.get(`/api/agents/${agentId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(agentId);
    expect(data.data.name).toBe(agentData.name);
    expect(data.data.configuration).toEqual(agentData.configuration);
  });

  test('should update agent', async ({ request }) => {
    const agentData = TestDataGenerator.generateAgent(organizationId);
    const agentId = await apiHelper.createAgent(authToken, agentData);
    agentIds.push(agentId);

    const updateData = {
      name: 'Updated Agent Name',
      description: 'Updated description',
      configuration: {
        ...agentData.configuration,
        personality: 'updated personality'
      }
    };

    const response = await request.put(`/api/agents/${agentId}`, {
      headers: apiHelper.getAuthHeaders(authToken),
      data: updateData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updateData.name);
    expect(data.data.description).toBe(updateData.description);
    expect(data.data.configuration.personality).toBe(updateData.configuration.personality);
  });

  test('should delete agent', async ({ request }) => {
    const agentData = TestDataGenerator.generateAgent(organizationId);
    const agentId = await apiHelper.createAgent(authToken, agentData);

    const response = await request.delete(`/api/agents/${agentId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify agent is deleted
    const getResponse = await request.get(`/api/agents/${agentId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(getResponse.status()).toBe(404);
  });

  test('should reject unauthorized access to agents', async ({ request }) => {
    const response = await request.get('/api/agents');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  test('should reject access to non-existent agent', async ({ request }) => {
    const response = await request.get('/api/agents/non-existent-id', {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  test('should validate agent creation data', async ({ request }) => {
    const invalidAgentData = {
      // Missing required fields
      description: 'Agent without name'
    };

    const response = await request.post('/api/agents', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: invalidAgentData
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('validation');
  });

  test.afterAll(async () => {
    // Clean up created agents
    if (authToken && agentIds.length > 0) {
      await apiHelper.cleanup(authToken, { agentIds });
    }
  });
});

test.describe('Organizations API Routes', () => {
  let apiHelper: ApiTestHelper;
  let authToken: string;
  let organizationIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    apiHelper = new ApiTestHelper(request);
    
    // Create initial organization and user for testing
    const orgData = TestDataGenerator.generateOrganization();
    const organizationId = await apiHelper.createOrganization(orgData);
    organizationIds.push(organizationId);

    const userData = TestDataGenerator.generateUser(organizationId);
    await apiHelper.registerUser(userData);
    const tokens = await apiHelper.loginUser(userData.email, userData.password);
    authToken = tokens.accessToken;
  });

  test('should create organization successfully', async ({ request }) => {
    const orgData = TestDataGenerator.generateOrganization();

    const response = await request.post('/api/organizations', {
      data: orgData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.name).toBe(orgData.name);
    expect(data.data.description).toBe(orgData.description);
    
    organizationIds.push(data.data.id);
  });

  test('should get organization details', async ({ request }) => {
    const orgId = organizationIds[0];

    const response = await request.get(`/api/organizations/${orgId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(orgId);
    expect(data.data.name).toBeDefined();
  });

  test('should update organization', async ({ request }) => {
    const orgId = organizationIds[0];
    const updateData = {
      name: 'Updated Organization Name',
      description: 'Updated organization description'
    };

    const response = await request.put(`/api/organizations/${orgId}`, {
      headers: apiHelper.getAuthHeaders(authToken),
      data: updateData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updateData.name);
    expect(data.data.description).toBe(updateData.description);
  });

  test('should list organization users', async ({ request }) => {
    const orgId = organizationIds[0];

    const response = await request.get(`/api/organizations/${orgId}/users`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.users)).toBe(true);
    expect(data.data.users.length).toBeGreaterThan(0);
  });

  test('should reject unauthorized organization access', async ({ request }) => {
    const orgId = organizationIds[0];

    const response = await request.get(`/api/organizations/${orgId}`);

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  test('should validate organization creation data', async ({ request }) => {
    const invalidOrgData = {
      // Missing required name field
      description: 'Organization without name'
    };

    const response = await request.post('/api/organizations', {
      data: invalidOrgData
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('validation');
  });
});
