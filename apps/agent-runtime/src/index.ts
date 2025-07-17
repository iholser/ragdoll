import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { config } from './config';
import { setupDatabase } from './database';
import { agentRoutes } from './routes/agents';
import { documentRoutes } from './routes/documents';
import { chatRoutes } from './routes/chat';
import { workflowRoutes } from './routes/workflows';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: config.CORS_ORIGINS,
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: config.MAX_FILE_SIZE,
    },
  });

  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
  });

  await fastify.register(websocket);

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'RAGdoll Agent Runtime API',
        description: 'API for RAGdoll agent runtime and chat services',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Setup database
  await setupDatabase();

  // Register middleware
  fastify.addHook('onRequest', authMiddleware);
  fastify.setErrorHandler(errorHandler);

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(agentRoutes, { prefix: '/api/agents' });
  await fastify.register(documentRoutes, { prefix: '/api/documents' });
  await fastify.register(workflowRoutes, { prefix: '/api/workflows' });
  await fastify.register(chatRoutes, { prefix: '/api/chat' });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildApp();
    
    await fastify.listen({
      port: config.PORT,
      host: config.HOST,
    });

    logger.info(`🚀 RAGdoll Agent Runtime running on http://${config.HOST}:${config.PORT}`);
    logger.info(`📖 API Documentation available at http://${config.HOST}:${config.PORT}/docs`);
    
  } catch (err) {
    logger.error('Failed to start server:', err);
    console.error('Detailed error:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { buildApp };
