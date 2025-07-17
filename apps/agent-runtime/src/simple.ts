import Fastify from 'fastify';
import { config } from './config';
import { setupDatabase } from './database';
import { logger } from './utils/logger';
import { healthRoutes } from './routes/health';
import { agentRoutes } from './routes/agents';
import { authMiddleware } from './middleware/auth';

async function buildSimpleApp() {
  const fastify = Fastify({
    logger: {
      level: 'info',
    },
  });

  // Setup database
  await setupDatabase();

  // Register middleware
  fastify.addHook('onRequest', authMiddleware);

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(agentRoutes, { prefix: '/api/agents' });

  return fastify;
}

async function startSimple() {
  try {
    const fastify = await buildSimpleApp();
    
    await fastify.listen({
      port: 3001,
      host: config.HOST,
    });

    logger.info(`🚀 Simple server running on http://${config.HOST}:3001`);
    
  } catch (err) {
    logger.error('Failed to start simple server:', err);
    console.error('Detailed error:', err);
    process.exit(1);
  }
}

startSimple();
