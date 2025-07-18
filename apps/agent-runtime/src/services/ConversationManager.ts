import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database';
import { logger } from '../utils/logger';
import { ChatConversation, ChatMessage } from '../types/chat';

export class ConversationManager {
  /**
   * Create a new conversation
   */
  async createConversation(
    agentId: string,
    sessionId?: string,
    title?: string,
    metadata?: Record<string, any>
  ): Promise<ChatConversation> {
    const conversationId = uuidv4();
    
    const conversations = await query(`
      INSERT INTO conversations (id, agent_id, session_id, title, status, metadata)
      VALUES ($1, $2, $3, $4, 'active', $5)
      RETURNING 
        id,
        agent_id as "agentId",
        session_id as "sessionId",
        title,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt",
        metadata
    `, [conversationId, agentId, sessionId, title, JSON.stringify(metadata || {})]);
    
    const conversation = conversations[0];
    logger.info({ conversationId, agentId, sessionId }, 'Conversation created');
    
    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
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
      WHERE id = $1
    `, [conversationId]);
    
    return conversations[0] || null;
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant' | 'system',
    metadata?: Record<string, any>
  ): Promise<ChatMessage> {
    const messageId = uuidv4();
    
    const messages = await query(`
      INSERT INTO messages (id, conversation_id, content, role, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        conversation_id as "conversationId",
        content,
        role,
        created_at as "timestamp",
        metadata
    `, [messageId, conversationId, content, role, JSON.stringify(metadata || {})]);
    
    const message = messages[0];
    
    // Update conversation updated_at timestamp
    await query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );
    
    logger.debug({ messageId, conversationId, role }, 'Message added to conversation');
    
    return message;
  }

  /**
   * Get conversation history (last N messages)
   */
  async getConversationHistory(conversationId: string, limit: number = 10): Promise<ChatMessage[]> {
    const messages = await query(`
      SELECT 
        id,
        conversation_id as "conversationId",
        content,
        role,
        created_at as "timestamp",
        metadata
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [conversationId, limit]);
    
    return messages.reverse(); // Return in chronological order
  }

  /**
   * Update conversation title (auto-generated from first message)
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    await query(
      'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [title, conversationId]
    );
    
    logger.debug({ conversationId, title }, 'Conversation title updated');
  }

  /**
   * Close conversation
   */
  async closeConversation(conversationId: string): Promise<void> {
    await query(
      'UPDATE conversations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['closed', conversationId]
    );
    
    logger.info({ conversationId }, 'Conversation closed');
  }

  /**
   * Generate session ID if not provided
   */
  generateSessionId(): string {
    return uuidv4();
  }

  /**
   * Generate conversation title from first user message
   */
  generateConversationTitle(firstMessage: string): string {
    // Take first 50 characters and clean up
    const title = firstMessage
      .substring(0, 50)
      .replace(/[^\w\s]/g, '')
      .trim();
    
    return title.length > 0 ? title + '...' : 'New Conversation';
  }
}
