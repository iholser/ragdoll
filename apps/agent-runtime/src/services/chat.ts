import { getAgentById, createConversation, addMessage, getConversationMessages } from '../database';
import { createAIProvider } from '@ragdoll/ai-integrations';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ChatResponse {
  messageId: string;
  conversationId: string;
  response: string;
  sources?: DocumentSource[];
  metadata?: Record<string, any>;
}

export interface DocumentSource {
  documentId: string;
  title: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export class ChatService {
  private aiProvider: any;

  constructor() {
    this.aiProvider = createAIProvider({
      provider: config.AI_PROVIDER,
      model: config.OLLAMA_MODEL,
      baseUrl: config.OLLAMA_HOST,
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  async processMessage(
    agentId: string,
    message: string,
    conversationId?: string,
    sessionId?: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<ChatResponse> {
    try {
      // Get agent information
      const agent = await getAgentById(agentId, 'bb5dde5f-4bac-4ef9-ae67-22436b014315'); // Use existing demo org ID
      if (!agent) {
        throw new Error('Agent not found or inactive');
      }

      // Create or get conversation
      let currentConversationId: string = conversationId || '';
      if (!currentConversationId) {
        const conversation = await createConversation(agentId, sessionId, userId, metadata);
        currentConversationId = conversation.id;
      }

      // Add user message to conversation
      await addMessage(currentConversationId, 'user', message, metadata);

      // Get conversation history for context
      const conversationHistory = await getConversationMessages(currentConversationId, 20);

      // Build context for AI
      const context = this.buildContext(agent, conversationHistory);

      // Search relevant documents (RAG)
      const sources = await this.searchDocuments(agentId, message);

      // Generate AI response
      const aiResponse = await this.generateResponse(context, message, sources, agent);

      // Add assistant response to conversation
      const assistantMessage = await addMessage(
        currentConversationId,
        'assistant',
        aiResponse,
        { sources, model: agent.modelName }
      );

      return {
        messageId: assistantMessage.id,
        conversationId: currentConversationId,
        response: aiResponse,
        sources,
        metadata: {
          model: agent.modelName,
          temperature: agent.temperature,
        },
      };
    } catch (error) {
      logger.error('Error processing chat message:', error);
      console.error('Detailed chat error:', error);
      throw error;
    }
  }

  private buildContext(agent: any, conversationHistory: any[]): string {
    let context = `${agent.systemPrompt}\n\n`;
    
    if (conversationHistory.length > 0) {
      context += "Previous conversation:\n";
      conversationHistory.forEach((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        context += `${role}: ${msg.content}\n`;
      });
      context += "\n";
    }

    return context;
  }

  private async searchDocuments(agentId: string, query: string): Promise<DocumentSource[]> {
    try {
      // TODO: Implement ChromaDB search
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error searching documents:', error);
      return [];
    }
  }

  private async generateResponse(
    context: string,
    message: string,
    sources: DocumentSource[],
    agent: any
  ): Promise<string> {
    try {
      // Add sources to context if available
      let enhancedContext = context;
      if (sources.length > 0) {
        enhancedContext += "Relevant information:\n";
        sources.forEach((source, index) => {
          enhancedContext += `${index + 1}. ${source.content}\n`;
        });
        enhancedContext += "\n";
      }

      // Build messages array
      const messages = [
        { role: 'system' as const, content: enhancedContext },
        { role: 'user' as const, content: message },
      ];

      // Generate response using AI provider
      const response = await this.aiProvider.generateResponse(messages, agent.systemPrompt);

      return response || agent.fallbackMessage;
    } catch (error) {
      logger.error('Error generating AI response:', error);
      return agent.fallbackMessage;
    }
  }

  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      const messages = await getConversationMessages(conversationId);
      return messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      logger.error('Error fetching conversation history:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
