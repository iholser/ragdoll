import { test, expect } from '@playwright/test';
import { TestDataGenerator } from './utils/api-helpers';

test.describe('Authentication API Routes', () => {
  test('should register a new user with organization successfully', async ({ request }) => {
    const orgData = TestDataGenerator.generateOrganization();
    const userData = TestDataGenerator.generateUser();
    
    const signupData = {
      email: userData.email,
      password: userData.password,
      firstName: 'Test',
      lastName: 'User',
      organizationName: orgData.name,
      organizationSlug: orgData.slug,
      organizationDescription: orgData.description
    };

    const response = await request.post('/api/auth/signup', {
      data: signupData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user.id).toBeDefined();
    expect(data.data.user.email).toBe(userData.email);
    expect(data.data.organization.id).toBeDefined();
    expect(data.data.organization.name).toBe(orgData.name);
    expect(data.data.token).toBeDefined();
  });

  test('should login with valid credentials', async ({ request }) => {
    // First create a user
    const orgData = TestDataGenerator.generateOrganization();
    const userData = TestDataGenerator.generateUser();
    
    const signupData = {
      email: userData.email,
      password: userData.password,
      firstName: 'Test',
      lastName: 'User',
      organizationName: orgData.name,
      organizationSlug: orgData.slug
    };

    await request.post('/api/auth/signup', { data: signupData });

    // Now test login
    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const response = await request.post('/api/auth/login', {
      data: loginData
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    expect(data.data.user.email).toBe(userData.email);
  });

  test('should reject login with invalid credentials', async ({ request }) => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    };

    const response = await request.post('/api/auth/login', {
      data: loginData
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('should reject duplicate organization slug', async ({ request }) => {
    const orgData = TestDataGenerator.generateOrganization();
    const userData1 = TestDataGenerator.generateUser();
    const userData2 = TestDataGenerator.generateUser();
    
    // First signup
    const signupData1 = {
      email: userData1.email,
      password: userData1.password,
      firstName: 'Test',
      lastName: 'User1',
      organizationName: orgData.name,
      organizationSlug: orgData.slug
    };

    const firstResponse = await request.post('/api/auth/signup', {
      data: signupData1
    });
    expect(firstResponse.ok()).toBeTruthy();

    // Second signup with same slug
    const signupData2 = {
      email: userData2.email,
      password: userData2.password,
      firstName: 'Test',
      lastName: 'User2',
      organizationName: 'Different Name',
      organizationSlug: orgData.slug // Same slug
    };

    const duplicateResponse = await request.post('/api/auth/signup', {
      data: signupData2
    });

    expect(duplicateResponse.status()).toBe(400);
    const data = await duplicateResponse.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('slug');
  });

  test('should reject protected route without token', async ({ request }) => {
    const response = await request.get('/api/agents');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Authentication required');
  });

  test('should reject protected route with malformed token', async ({ request }) => {
    const response = await request.get('/api/agents', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
