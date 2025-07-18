# E2E Tests for Ragdoll

This directory contains comprehensive end-to-end (E2E) tests for the Ragdoll platform using Playwright.

## Overview

The E2E tests cover all major API routes and workflows:

- **Authentication** (`auth.spec.ts`) - User registration, login, logout, token refresh
- **Chat Runtime** (`chat-runtime.spec.ts`) - Chat message processing, RAG context retrieval, conversation management
- **Agents & Organizations** (`agents-organizations.spec.ts`) - CRUD operations for agents and organizations
- **Documents & Health** (`documents-health.spec.ts`) - Document management, search, health checks
- **Integration** (`integration.spec.ts`) - Full workflow tests covering complete user journeys
- **Smoke Tests** (`smoke.spec.ts`) - Basic functionality and service availability

## Prerequisites

Before running E2E tests, ensure the following services are running:

1. **PostgreSQL** - Database on port 5432
2. **ChromaDB** - Vector database on port 8000
3. **Redis** - Cache service on port 6379
4. **Agent Runtime** - Backend API on port 3000
5. **Admin UI** (optional) - Frontend on port 5173

### Quick Setup with Docker

```bash
# Start required services
cd docker
docker-compose up -d postgres chromadb redis

# Start the application
cd ../apps/agent-runtime
npm run dev

# In another terminal (optional)
cd ../apps/admin-ui
npm run dev
```

## Running Tests

### Install Dependencies

```bash
# Install Playwright and dependencies
pnpm install
npx playwright install
```

### Run All Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI for debugging
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed
```

### Run Specific Test Suites

```bash
# Run only smoke tests (quick validation)
pnpm test:e2e:smoke

# Run authentication tests
pnpm test:e2e:auth

# Run chat runtime tests
pnpm test:e2e:chat

# Run integration tests
pnpm test:e2e:integration
```

### View Test Results

```bash
# Show HTML report
pnpm test:e2e:report
```

## Test Structure

### Test Files

- **`smoke.spec.ts`** - Basic service availability and CORS validation
- **`auth.spec.ts`** - Complete authentication flow testing
- **`chat-runtime.spec.ts`** - Chat message processing and RAG functionality
- **`agents-organizations.spec.ts`** - CRUD operations for core entities
- **`documents-health.spec.ts`** - Document management and system health
- **`integration.spec.ts`** - End-to-end user workflows

### Utilities

- **`utils/api-helpers.ts`** - Reusable API testing utilities and test data generators

### Configuration

- **`playwright.config.ts`** - Playwright configuration with multi-browser support
- **`setup.ts`** - Global test setup ensuring services are ready

## Test Features

### Authentication Testing

- User registration with validation
- Login/logout flows
- Token refresh mechanisms
- Protected route access control

### Chat Runtime Testing

- Message processing pipeline
- RAG context retrieval
- Conversation state management
- Action evaluation
- Error handling and graceful degradation

### CRUD Operations

- Agent creation, update, deletion
- Organization management
- Document upload, search, chunking
- Session management

### Integration Workflows

- Complete customer service scenarios
- Multi-user organization workflows
- Knowledge base updates
- Error recovery testing

## Configuration

### Environment Variables

The tests use the following default endpoints:

- **Backend API**: `http://localhost:3000`
- **Frontend**: `http://localhost:5173`
- **ChromaDB**: `http://localhost:8000`

### Browser Support

Tests run on:

- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Debugging

### Running Single Tests

```bash
# Run specific test file
npx playwright test auth.spec.ts

# Run specific test case
npx playwright test auth.spec.ts -g "should login with valid credentials"
```

### Debug Mode

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Run with headed browser and slow motion
npx playwright test --headed --slowMo=1000
```

### Screenshots and Videos

Tests automatically capture:

- Screenshots on failure
- Videos for failed tests
- Traces for debugging

## CI/CD Integration

The E2E tests are configured to run in GitHub Actions:

- **Trigger**: Push to main/develop branches and pull requests
- **Services**: PostgreSQL, Redis, ChromaDB automatically started
- **Artifacts**: Test reports and screenshots uploaded on failure

### Manual CI Run

```bash
# Run the same setup as CI locally
docker-compose -f docker/docker-compose.ci.yml up -d
pnpm test:e2e
```

## Test Data Management

### Automatic Cleanup

Tests automatically clean up created resources:

- Organizations
- Users
- Agents
- Documents
- Sessions
- Conversations

### Test Isolation

Each test:

- Uses unique test data (timestamped)
- Runs in isolation from other tests
- Cleans up after completion

## Troubleshooting

### Common Issues

1. **Services not running**: Ensure all prerequisite services are up
2. **Port conflicts**: Check that ports 3000, 5173, 5432, 6379, 8000 are available
3. **Database connection**: Verify PostgreSQL is accessible with correct credentials
4. **ChromaDB issues**: Tests have graceful degradation for ChromaDB unavailability

### Debug Commands

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:8000/api/v1/heartbeat

# Check database connection
docker-compose exec postgres psql -U ragdoll -d ragdoll -c "SELECT 1;"

# View service logs
docker-compose logs postgres
docker-compose logs chromadb
```

## Contributing

When adding new tests:

1. Follow the existing pattern in test files
2. Use the helper utilities in `utils/api-helpers.ts`
3. Include proper cleanup in `afterAll` hooks
4. Add meaningful test descriptions
5. Test both success and error scenarios

### Test Naming Convention

```typescript
test.describe('Feature Name', () => {
  test('should perform action successfully', async ({ request }) => {
    // Test implementation
  });
  
  test('should reject invalid input', async ({ request }) => {
    // Error case testing
  });
});
```
