import { test as setup, expect } from '@playwright/test';

/**
 * Global setup for E2E tests
 * This runs once before all tests to ensure services are ready
 */
setup('ensure services are running', async ({ request }) => {
  console.log('Setting up E2E test environment...');

  // Check that backend is running
  const healthResponse = await request.get('http://localhost:3000/health');
  expect(healthResponse.ok()).toBeTruthy();
  
  const healthData = await healthResponse.json();
  expect(healthData.success).toBe(true);
  expect(healthData.status).toBe('healthy');

  console.log('✅ Agent Runtime service is healthy');

  // Check that frontend is running (if needed)
  try {
    const frontendResponse = await request.get('http://localhost:5173');
    if (frontendResponse.ok()) {
      console.log('✅ Admin UI service is running');
    }
  } catch (error) {
    console.log('⚠️ Admin UI service not running (optional for API tests)');
  }

  // Check database connectivity through a simple API call
  try {
    const versionResponse = await request.get('http://localhost:3000/api/version');
    if (versionResponse.ok()) {
      console.log('✅ Database connectivity verified');
    }
  } catch (error) {
    console.log('⚠️ Database connectivity issue detected');
  }

  // Check ChromaDB connectivity
  try {
    const chromaResponse = await request.get('http://localhost:8000/api/v1/heartbeat');
    if (chromaResponse.ok()) {
      console.log('✅ ChromaDB service is running');
    }
  } catch (error) {
    console.log('⚠️ ChromaDB service not available (tests will use graceful degradation)');
  }

  console.log('🚀 E2E test environment setup complete');
});
