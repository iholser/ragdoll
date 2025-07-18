import { test, expect } from '@playwright/test';
import { ApiTestHelper, TestDataGenerator } from './utils/api-helpers';

test.describe('Documents API Routes', () => {
  let apiHelper: ApiTestHelper;
  let organizationId: string;
  let authToken: string;
  let documentIds: string[] = [];

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

  test('should upload document successfully', async ({ request }) => {
    const documentData = TestDataGenerator.generateDocument(organizationId);

    const response = await request.post('/api/documents', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: documentData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.title).toBe(documentData.title);
    expect(data.data.organizationId).toBe(organizationId);
    
    documentIds.push(data.data.id);
  });

  test('should list documents for organization', async ({ request }) => {
    // Create a couple of documents first
    const doc1Data = TestDataGenerator.generateDocument(organizationId);
    const doc2Data = TestDataGenerator.generateDocument(organizationId);

    const doc1Id = await apiHelper.uploadDocument(authToken, doc1Data);
    const doc2Id = await apiHelper.uploadDocument(authToken, doc2Data);
    documentIds.push(doc1Id, doc2Id);

    const response = await request.get('/api/documents', {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.documents)).toBe(true);
    expect(data.data.documents.length).toBeGreaterThanOrEqual(2);
    
    const docTitles = data.data.documents.map((d: any) => d.title);
    expect(docTitles).toContain(doc1Data.title);
    expect(docTitles).toContain(doc2Data.title);
  });

  test('should get document by ID', async ({ request }) => {
    const documentData = TestDataGenerator.generateDocument(organizationId);
    const documentId = await apiHelper.uploadDocument(authToken, documentData);
    documentIds.push(documentId);

    const response = await request.get(`/api/documents/${documentId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(documentId);
    expect(data.data.title).toBe(documentData.title);
    expect(data.data.content).toBe(documentData.content);
    expect(data.data.metadata).toEqual(documentData.metadata);
  });

  test('should update document', async ({ request }) => {
    const documentData = TestDataGenerator.generateDocument(organizationId);
    const documentId = await apiHelper.uploadDocument(authToken, documentData);
    documentIds.push(documentId);

    const updateData = {
      title: 'Updated Document Title',
      content: 'Updated document content',
      metadata: {
        ...documentData.metadata,
        updated: true
      }
    };

    const response = await request.put(`/api/documents/${documentId}`, {
      headers: apiHelper.getAuthHeaders(authToken),
      data: updateData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe(updateData.title);
    expect(data.data.content).toBe(updateData.content);
    expect(data.data.metadata.updated).toBe(true);
  });

  test('should search documents', async ({ request }) => {
    // Upload a document with specific content
    const documentData = {
      title: 'Searchable Document',
      content: 'This document contains information about customer service best practices and troubleshooting guides.',
      organizationId,
      metadata: {
        type: 'guide',
        category: 'customer-service'
      }
    };

    const documentId = await apiHelper.uploadDocument(authToken, documentData);
    documentIds.push(documentId);

    // Search for the document
    const response = await request.post('/api/documents/search', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: {
        query: 'customer service',
        limit: 10
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.documents)).toBe(true);
    expect(data.data.documents.length).toBeGreaterThan(0);
    
    const foundDoc = data.data.documents.find((d: any) => d.id === documentId);
    expect(foundDoc).toBeDefined();
    expect(foundDoc.title).toBe(documentData.title);
  });

  test('should delete document', async ({ request }) => {
    const documentData = TestDataGenerator.generateDocument(organizationId);
    const documentId = await apiHelper.uploadDocument(authToken, documentData);

    const response = await request.delete(`/api/documents/${documentId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify document is deleted
    const getResponse = await request.get(`/api/documents/${documentId}`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(getResponse.status()).toBe(404);
  });

  test('should process document chunks for RAG', async ({ request }) => {
    const documentData = {
      title: 'Large Document for Chunking',
      content: `This is a large document that should be split into chunks for RAG processing. 
      It contains multiple paragraphs and sections. The first section covers introduction to the topic.
      The second section provides detailed information about implementation.
      The third section includes troubleshooting guides and best practices.
      Finally, the conclusion summarizes all the key points discussed in the document.`,
      organizationId,
      metadata: {
        type: 'manual',
        processForRAG: true
      }
    };

    const documentId = await apiHelper.uploadDocument(authToken, documentData);
    documentIds.push(documentId);

    // Get document chunks
    const response = await request.get(`/api/documents/${documentId}/chunks`, {
      headers: apiHelper.getAuthHeaders(authToken)
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.chunks)).toBe(true);
    expect(data.data.chunks.length).toBeGreaterThan(0);
    
    // Each chunk should have required properties
    data.data.chunks.forEach((chunk: any) => {
      expect(chunk.content).toBeDefined();
      expect(chunk.metadata).toBeDefined();
      expect(chunk.embedding).toBeDefined();
    });
  });

  test('should reject unauthorized document access', async ({ request }) => {
    const response = await request.get('/api/documents');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  test('should validate document upload data', async ({ request }) => {
    const invalidDocumentData = {
      // Missing required fields
      content: 'Document without title'
    };

    const response = await request.post('/api/documents', {
      headers: apiHelper.getAuthHeaders(authToken),
      data: invalidDocumentData
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('validation');
  });

  test.afterAll(async () => {
    // Clean up created documents
    if (authToken && documentIds.length > 0) {
      await apiHelper.cleanup(authToken, { documentIds });
    }
  });
});

test.describe('Health and System Routes', () => {
  let apiHelper: ApiTestHelper;

  test.beforeAll(async ({ request }) => {
    apiHelper = new ApiTestHelper(request);
  });

  test('should return healthy status', async ({ request }) => {
    await apiHelper.testHealthEndpoint();
  });

  test('should return health check with detailed information', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
  });

  test('should return API version information', async ({ request }) => {
    const response = await request.get('/api/version');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.version).toBeDefined();
    expect(data.data.apiVersion).toBeDefined();
    expect(data.data.buildDate).toBeDefined();
  });

  test('should return system metrics', async ({ request }) => {
    const response = await request.get('/api/metrics');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.uptime).toBeDefined();
    expect(data.data.memory).toBeDefined();
    expect(data.data.connections).toBeDefined();
  });

  test('should handle 404 for non-existent routes', async ({ request }) => {
    const response = await request.get('/api/non-existent-route');

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  test('should validate CORS headers', async ({ request }) => {
    const response = await request.get('/health', {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should handle OPTIONS preflight requests', async ({ request }) => {
    const response = await request.fetch('/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
    expect(response.headers()['access-control-allow-headers']).toBeDefined();
  });
});
