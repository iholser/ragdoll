import { FastifyInstance } from 'fastify';
import { checkDatabaseHealth } from '../database';
import { logger } from '../utils/logger';

export const healthRoutes = async (fastify: FastifyInstance) => {
  // Basic health check
  fastify.get('/', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  });

  // Detailed health check with database connections
  fastify.get('/detailed', async (request, reply) => {
    try {
      const health = await checkDatabaseHealth();
      
      const response = {
        success: health.postgres && health.chroma,
        status: health.postgres && health.chroma ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          postgres: health.postgres ? 'healthy' : 'unhealthy',
          chromadb: health.chroma ? 'healthy' : 'unhealthy',
        },
        details: health.details,
      };

      const statusCode = response.success ? 200 : 503;
      return reply.status(statusCode).send(response);
    } catch (error) {
      logger.error('Health check failed:', error);
      return reply.status(500).send({
        success: false,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  // Readiness probe
  fastify.get('/ready', async (request, reply) => {
    try {
      const health = await checkDatabaseHealth();
      
      if (health.postgres && health.chroma) {
        return {
          success: true,
          status: 'ready',
          timestamp: new Date().toISOString(),
        };
      } else {
        return reply.status(503).send({
          success: false,
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: 'Required services unavailable',
        });
      }
    } catch (error) {
      logger.error('Readiness check failed:', error);
      return reply.status(503).send({
        success: false,
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Required services unavailable',
      });
    }
  });

  // Liveness probe
  fastify.get('/live', async (request, reply) => {
    return {
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  });
};
