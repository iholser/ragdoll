import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';
import { ChatRequest, ChatResponse } from '../types/chat';
import { ConversationManager } from '../services/ConversationManager';
import { RAGService } from '../services/RAGService';
import { ActionEvaluator } from '../services/ActionEvaluator';
import { AIResponseGenerator } from '../services/AIResponseGenerator';
import { query } from '../database';

export class ChatController {
  private conversationManager: ConversationManager;
  private ragService: RAGService;
  private actionEvaluator: ActionEvaluator;
  private aiGenerator: AIResponseGenerator;

  constructor() {
    this.conversationManager = new ConversationManager();
    this.ragService = new RAGService();
    this.actionEvaluator = new ActionEvaluator();
    this.aiGenerator = new AIResponseGenerator();
  }

  /**
   * Initialize the chat controller and its services
   */
  async initialize(): Promise<void> {
    try {
      await this.ragService.initialize();
      logger.info('Chat controller initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize chat controller');
      throw error;
    }
  }

  /**
   * Process chat message through the complete pipeline
   */
  async processMessage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Get agent ID from auth context
      const agentId = (request as any).user?.agentId;
      if (!agentId) {
        return reply.status(401).send({ error: 'Agent ID not found in request context' });
      }

      // Validate request body
      const chatRequest = this.validateChatRequest(request.body);
      
      // Generate session ID if not provided
      const sessionId = chatRequest.sessionId || this.conversationManager.generateSessionId();
      
      // Get or create conversation
      let conversation;
      if (chatRequest.conversationId) {
        conversation = await this.conversationManager.getConversation(chatRequest.conversationId);
        if (!conversation) {
          return reply.status(404).send({ error: 'Conversation not found' });
        }
      } else {
        const title = this.conversationManager.generateConversationTitle(chatRequest.message);
        conversation = await this.conversationManager.createConversation(
          agentId,
          sessionId,
          title,
          chatRequest.metadata
        );
      }

      const conversationId = conversation.id;

      // Add user message to conversation
      await this.conversationManager.addMessage(
        conversationId,
        chatRequest.message,
        'user',
        chatRequest.metadata
      );

      // Get conversation history for context
      const conversationHistory = await this.conversationManager.getConversationHistory(
        conversationId,
        10
      );

      // Retrieve relevant context via RAG
      const retrievedContext = await this.ragService.retrieveContext(
        chatRequest.message,
        agentId,
        5,
        0.7
      );

      // Evaluate workflow conditions and execute actions
      const actionResults = await this.actionEvaluator.evaluateAndExecute(
        agentId,
        chatRequest.message,
        conversationId,
        chatRequest.metadata || {}
      );

      // Get agent's system prompt
      const systemPrompt = await this.getAgentSystemPrompt(agentId);

      // Generate AI response
      const aiResponse = await this.aiGenerator.generateResponse(
        chatRequest.message,
        agentId,
        conversationHistory.slice(0, -1), // Exclude the current user message
        retrievedContext,
        systemPrompt
      );

      // Add AI response to conversation
      await this.conversationManager.addMessage(
        conversationId,
        aiResponse,
        'assistant',
        {
          retrievedContextCount: retrievedContext.length,
          actionsTriggered: actionResults.length,
          processingMetadata: {
            ragResults: retrievedContext.length,
            actionsExecuted: actionResults.filter(a => a.success).length,
            actionsFailed: actionResults.filter(a => !a.success).length
          }
        }
      );

      // Prepare response
      const response: ChatResponse = {
        response: aiResponse,
        conversationId,
        sessionId,
        actionsTriggered: actionResults,
        metadata: {
          contextUsed: retrievedContext.length > 0,
          retrievedSources: retrievedContext.map(c => c.source),
          actionsExecuted: actionResults.length,
          processingTime: Date.now() - Number(request.headers['x-request-start'] || Date.now())
        }
      };

      logger.info({
        agentId,
        conversationId,
        sessionId,
        messageLength: chatRequest.message.length,
        responseLength: aiResponse.length,
        contextCount: retrievedContext.length,
        actionsTriggered: actionResults.length
      }, 'Chat message processed successfully');

      return reply.send(response);

    } catch (error) {
      logger.error({ error, body: request.body }, 'Error processing chat message');
      
      // Return user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return reply.status(500).send({ 
        error: 'Failed to process message',
        message: errorMessage 
      });
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { conversationId } = request.params as { conversationId: string };
      const { limit = 50 } = request.query as { limit?: number };

      // Verify conversation belongs to agent
      const agentId = (request as any).user?.agentId;
      const conversation = await this.conversationManager.getConversation(conversationId);
      
      if (!conversation || conversation.agentId !== agentId) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }

      const history = await this.conversationManager.getConversationHistory(
        conversationId,
        Number(limit)
      );

      return reply.send({
        conversation,
        messages: history,
        messageCount: history.length
      });

    } catch (error) {
      logger.error({ error, params: request.params }, 'Error fetching conversation history');
      return reply.status(500).send({ error: 'Failed to fetch conversation history' });
    }
  }

  /**
   * Get conversation list for agent
   */
  async getConversations(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const agentId = (request as any).user?.agentId;
      const { limit = 20, offset = 0, status } = request.query as { 
        limit?: number; 
        offset?: number; 
        status?: string; 
      };

      let whereClause = 'WHERE agent_id = $1';
      const params: any[] = [agentId];

      if (status) {
        whereClause += ' AND status = $2';
        params.push(status);
      }

      const conversations = await query(`
        SELECT 
          id,
          agent_id as "agentId",
          session_id as "sessionId",
          title,
          status,
          created_at as "createdAt",
          updated_at as "updatedAt",
          metadata
        FROM conversations
        ${whereClause}
        ORDER BY updated_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, Number(limit), Number(offset)]);

      return reply.send({
        conversations,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: conversations.length
        }
      });

    } catch (error) {
      logger.error({ error, query: request.query }, 'Error fetching conversations');
      return reply.status(500).send({ error: 'Failed to fetch conversations' });
    }
  }

  /**
   * Close conversation
   */
  async closeConversation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { conversationId } = request.params as { conversationId: string };
      const agentId = (request as any).user?.agentId;

      // Verify conversation belongs to agent
      const conversation = await this.conversationManager.getConversation(conversationId);
      if (!conversation || conversation.agentId !== agentId) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }

      await this.conversationManager.closeConversation(conversationId);

      return reply.send({
        success: true,
        conversationId,
        status: 'closed'
      });

    } catch (error) {
      logger.error({ error, params: request.params }, 'Error closing conversation');
      return reply.status(500).send({ error: 'Failed to close conversation' });
    }
  }

  /**
   * Health check for chat services
   */
  async healthCheck(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const aiHealth = await this.aiGenerator.healthCheck();
      
      const health = {
        status: 'healthy',
        services: {
          conversationManager: true,
          ragService: true,
          actionEvaluator: true,
          aiProviders: aiHealth
        },
        timestamp: new Date().toISOString()
      };

      const allHealthy = aiHealth.every(provider => provider.healthy);
      if (!allHealthy) {
        health.status = 'degraded';
      }

      return reply.send(health);

    } catch (error) {
      logger.error({ error }, 'Health check failed');
      return reply.status(500).send({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate chat request
   */
  private validateChatRequest(body: any): ChatRequest {
    if (!body || typeof body !== 'object') {
      throw new Error('Request body is required');
    }

    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      throw new Error('Message is required and cannot be empty');
    }

    if (body.message.length > 10000) {
      throw new Error('Message too long (maximum 10,000 characters)');
    }

    return {
      message: body.message.trim(),
      conversationId: body.conversationId || undefined,
      sessionId: body.sessionId || undefined,
      metadata: body.metadata || {}
    };
  }

  /**
   * Get agent's system prompt from database
   */
  private async getAgentSystemPrompt(agentId: string): Promise<string | undefined> {
    try {
      const agents = await query(
        'SELECT system_prompt FROM agents WHERE id = $1',
        [agentId]
      );

      return agents[0]?.system_prompt || undefined;
    } catch (error) {
      logger.error({ error, agentId }, 'Error fetching agent system prompt');
      return undefined;
    }
  }
}
