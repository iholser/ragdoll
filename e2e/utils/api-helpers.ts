import { APIRequestContext, expect } from '@playwright/test';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface TestUser {
  email: string;
  password: string;
  name: string;
  organizationId?: string;
}

export interface TestOrganization {
  name: string;
  slug: string;
  description?: string;
}

/**
 * Helper class for API testing utilities
 */
export class ApiTestHelper {
  private baseURL: string;
  private request: APIRequestContext;

  constructor(request: APIRequestContext, baseURL = 'http://localhost:3000') {
    this.request = request;
    this.baseURL = baseURL;
  }

  /**
   * Create organization by registering a user (since organizations are created during signup)
   */
  async createOrganization(orgData: TestOrganization): Promise<string> {
    // Use signup endpoint to create organization and user
    const userData = TestDataGenerator.generateUser();
    const signupData = {
      ...userData,
      organizationName: orgData.name,
      organizationSlug: orgData.slug,
      organizationDescription: orgData.description
    };

    const response = await this.request.post(`${this.baseURL}/api/auth/signup`, {
      data: signupData
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    return data.data.organization.id;
  }

  /**
   * Register a new test user with organization
   */
  async registerUser(userData: TestUser & { organizationName: string; organizationSlug: string }): Promise<string> {
    const response = await this.request.post(`${this.baseURL}/api/auth/signup`, {
      data: userData
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    return data.data.user.id;
  }

  /**
   * Login user and get authentication tokens
   */
  async loginUser(email: string, password: string): Promise<AuthTokens> {
    const response = await this.request.post(`${this.baseURL}/api/auth/login`, {
      data: { email, password }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken
    };
  }

  /**
   * Get authenticated headers
   */
  getAuthHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Test health endpoint
   */
  async testHealthEndpoint(): Promise<void> {
    const response = await this.request.get(`${this.baseURL}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('healthy');
  }

  /**
   * Create a test session
   */
  async createSession(token: string, sessionData: any): Promise<string> {
    const response = await this.request.post(`${this.baseURL}/api/sessions`, {
      headers: this.getAuthHeaders(token),
      data: sessionData
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    return data.data.id;
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(token: string, messageData: any): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/runtime/chat`, {
      headers: this.getAuthHeaders(token),
      data: messageData
    });
    
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Create test agent
   */
  async createAgent(token: string, agentData: any): Promise<string> {
    const response = await this.request.post(`${this.baseURL}/api/agents`, {
      headers: this.getAuthHeaders(token),
      data: agentData
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    return data.data.id;
  }

  /**
   * Upload document
   */
  async uploadDocument(token: string, documentData: any): Promise<string> {
    const response = await this.request.post(`${this.baseURL}/api/documents`, {
      headers: this.getAuthHeaders(token),
      data: documentData
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    return data.data.id;
  }

  /**
   * Cleanup test data
   */
  async cleanup(token: string, resourceIds: { 
    organizationId?: string;
    userId?: string;
    sessionIds?: string[];
    agentIds?: string[];
    documentIds?: string[];
  }): Promise<void> {
    const headers = this.getAuthHeaders(token);

    // Clean up sessions
    if (resourceIds.sessionIds) {
      for (const sessionId of resourceIds.sessionIds) {
        await this.request.delete(`${this.baseURL}/api/sessions/${sessionId}`, { headers });
      }
    }

    // Clean up agents
    if (resourceIds.agentIds) {
      for (const agentId of resourceIds.agentIds) {
        await this.request.delete(`${this.baseURL}/api/agents/${agentId}`, { headers });
      }
    }

    // Clean up documents
    if (resourceIds.documentIds) {
      for (const documentId of resourceIds.documentIds) {
        await this.request.delete(`${this.baseURL}/api/documents/${documentId}`, { headers });
      }
    }
  }
}

/**
 * Generate test data
 */
export class TestDataGenerator {
  static generateOrganization(): TestOrganization {
    const timestamp = Date.now();
    return {
      name: `Test Org ${timestamp}`,
      slug: `test-org-${timestamp}`,
      description: `Test organization created at ${new Date().toISOString()}`
    };
  }

  static generateUser(organizationId?: string): TestUser {
    const timestamp = Date.now();
    return {
      email: `test.user.${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${timestamp}`,
      organizationId
    };
  }

  static generateAgent(organizationId: string) {
    const timestamp = Date.now();
    return {
      name: `Test Agent ${timestamp}`,
      description: `Test agent created at ${new Date().toISOString()}`,
      organizationId,
      configuration: {
        personality: 'helpful and professional',
        knowledge_base: 'general customer service',
        response_style: 'concise and clear'
      }
    };
  }

  static generateDocument(organizationId: string) {
    const timestamp = Date.now();
    return {
      title: `Test Document ${timestamp}`,
      content: `This is a test document created at ${new Date().toISOString()}. It contains sample information for testing the RAG functionality.`,
      organizationId,
      metadata: {
        type: 'test',
        source: 'e2e-test',
        category: 'documentation'
      }
    };
  }

  static generateChatMessage(sessionId: string) {
    return {
      sessionId,
      message: 'Hello, I need help with my account',
      metadata: {
        source: 'e2e-test',
        timestamp: new Date().toISOString()
      }
    };
  }
}
