import { FastifyInstance } from 'fastify';
import { ChatController } from '../controllers/ChatController';
import { authMiddleware } from '../middleware/auth';

// Create authentication decorator
const authenticate = async (request: any, reply: any) => {
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }
  
  // For runtime routes, we need agentId - get it from organizationId or add agent lookup
  if (!request.user.organizationId) {
    return reply.status(401).send({ error: 'Organization context required' });
  }
  
  // For now, use organizationId as agentId - in real implementation would look up agent
  request.user.agentId = request.user.organizationId;
};

export async function runtimeRoutes(fastify: FastifyInstance) {
  const chatController = new ChatController();
  
  // Initialize chat controller
  await chatController.initialize();

  // Chat endpoints
  fastify.post('/api/runtime/chat', {
    schema: {
      description: 'Process a chat message',
      tags: ['Chat Runtime'],
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', maxLength: 10000 },
          conversationId: { type: 'string' },
          sessionId: { type: 'string' },
          metadata: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            response: { type: 'string' },
            conversationId: { type: 'string' },
            sessionId: { type: 'string' },
            actionsTriggered: { type: 'array' },
            metadata: { type: 'object' }
          }
        }
      }
    },
    preHandler: authenticate
  }, chatController.processMessage.bind(chatController));

  // Get conversation history
  fastify.get('/api/runtime/conversations/:conversationId/history', {
    schema: {
      description: 'Get conversation message history',
      tags: ['Chat Runtime'],
      params: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 }
        }
      }
    },
    preHandler: authenticate
  }, chatController.getConversationHistory.bind(chatController));

  // Get conversations list
  fastify.get('/api/runtime/conversations', {
    schema: {
      description: 'Get list of conversations for agent',
      tags: ['Chat Runtime'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          status: { type: 'string', enum: ['active', 'closed', 'archived'] }
        }
      }
    },
    preHandler: authenticate
  }, chatController.getConversations.bind(chatController));

  // Close conversation
  fastify.post('/api/runtime/conversations/:conversationId/close', {
    schema: {
      description: 'Close a conversation',
      tags: ['Chat Runtime'],
      params: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' }
        }
      }
    },
    preHandler: authenticate
  }, chatController.closeConversation.bind(chatController));

  // Health check
  fastify.get('/api/runtime/health', {
    schema: {
      description: 'Check health of chat runtime services',
      tags: ['Chat Runtime']
    }
  }, chatController.healthCheck.bind(chatController));
}
