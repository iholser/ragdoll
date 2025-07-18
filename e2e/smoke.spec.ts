import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should have working health endpoint', async ({ request }) => {
    const response = await request.get('/health');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('healthy');
  });

  test('should return 401 for non-existent protected endpoints', async ({ request }) => {
    // Since auth middleware runs globally, non-existent protected routes return 401
    const response = await request.get('/api/non-existent');
    
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Authentication required');
  });

  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.get('/health');
    
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers['vary']).toBe('Origin'); // Fastify CORS sets this
    expect(headers['access-control-allow-credentials']).toBe('true');
  });

  test('should reject unauthorized access to protected routes', async ({ request }) => {
    const protectedRoutes = [
      '/api/agents',
      '/api/documents',
      '/api/runtime/chat',
      '/api/auth/me'
    ];

    for (const route of protectedRoutes) {
      const response = await request.get(route);
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
    }
  });
});
