import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { chatService } from '../services/chat';
import { logger } from '../utils/logger';

export const chatRoutes = async (fastify: FastifyInstance) => {
  // Chat endpoint for widget
  fastify.post('/', {
    schema: {
      description: 'Send a chat message to an agent',
      tags: ['chat'],
      body: Type.Object({
        message: Type.String({ minLength: 1 }),
        agentId: Type.String({ format: 'uuid' }),
        conversationId: Type.Optional(Type.String({ format: 'uuid' })),
        sessionId: Type.Optional(Type.String()),
        userId: Type.Optional(Type.String()),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            conversationId: Type.String({ format: 'uuid' }),
            message: Type.String(),
            sources: Type.Optional(Type.Array(Type.Object({
              documentId: Type.String({ format: 'uuid' }),
              chunkId: Type.String({ format: 'uuid' }),
              content: Type.String(),
              score: Type.Number(),
            }))),
            actionsTriggered: Type.Optional(Type.Array(Type.Object({
              actionId: Type.String({ format: 'uuid' }),
              actionType: Type.String(),
              status: Type.String(),
              result: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
            }))),
            metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
            createdAt: Type.String({ format: 'date-time' }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { agentId, message, conversationId, sessionId, userId, metadata } = request.body as any;

      // Process message through chat service
      const result = await chatService.processMessage(
        agentId,
        message,
        conversationId,
        sessionId,
        userId,
        metadata
      );

      return {
        success: true,
        data: {
          id: result.messageId,
          conversationId: result.conversationId,
          message: result.response,
          sources: result.sources || [],
          actionsTriggered: [],
          metadata: result.metadata || {},
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error processing chat message:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to process chat message',
      });
    }
  });

  // Get conversation history
  fastify.get('/conversations/:id', {
    schema: {
      description: 'Get conversation history',
      tags: ['chat'],
      params: Type.Object({
        id: Type.String({ format: 'uuid' }),
      }),
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const messages = await chatService.getConversationHistory(id);

      return {
        success: true,
        data: messages,
      };
    } catch (error) {
      logger.error('Error fetching conversation:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch conversation',
      });
    }
  });
};
