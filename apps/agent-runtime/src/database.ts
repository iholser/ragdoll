import { Pool, PoolClient } from 'pg';
import { ChromaClient } from 'chromadb';
import { config, getDatabaseUrl, getChromaConfig } from './config';
import { logger } from './utils/logger';
import { setupDatabaseWithMigrations } from './database/migrations';

// PostgreSQL connection pool
let pgPool: Pool;

// ChromaDB client
let chromaClient: ChromaClient;

/**
 * Initialize PostgreSQL connection pool
 */
export const initializePostgres = async (): Promise<Pool> => {
  try {
    pgPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ PostgreSQL connection established');
    return pgPool;
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

/**
 * Initialize ChromaDB client
 */
export const initializeChroma = async (): Promise<ChromaClient> => {
  try {
    const chromaConfig = getChromaConfig();
    chromaClient = new ChromaClient({
      path: chromaConfig.path,
    });

    // Test connection
    await chromaClient.heartbeat();
    logger.info('✅ ChromaDB connection established');
    return chromaClient;
  } catch (error) {
    logger.error('❌ Failed to connect to ChromaDB:', error);
    throw error;
  }
};

/**
 * Setup all database connections
 */
export const setupDatabase = async () => {
  try {
    await initializePostgres();
    
    // Try to initialize ChromaDB but don't fail if it's not available
    try {
      await initializeChroma();
    } catch (error) {
      logger.warn('⚠️  ChromaDB not available - continuing without RAG functionality');
    }
    
    await setupDatabaseWithMigrations();
    logger.info('🗄️  Database setup complete');
  } catch (error) {
    logger.error('❌ Database setup failed:', error);
    throw error;
  }
};

/**
 * Get PostgreSQL pool instance
 */
export const getPostgresPool = (): Pool => {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized. Call setupDatabase() first.');
  }
  return pgPool;
};

/**
 * Get ChromaDB client instance
 */
export const getChromaClient = (): ChromaClient => {
  if (!chromaClient) {
    throw new Error('ChromaDB client not initialized. Call setupDatabase() first.');
  }
  return chromaClient;
};

/**
 * Execute a PostgreSQL query with connection from pool
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const pool = getPostgresPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
};

/**
 * Execute a PostgreSQL transaction
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const pool = getPostgresPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close all database connections
 */
export const closeConnections = async () => {
  try {
    if (pgPool) {
      await pgPool.end();
      logger.info('PostgreSQL pool closed');
    }
    // ChromaDB client doesn't need explicit closing
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Graceful shutdown
process.on('SIGTERM', closeConnections);
process.on('SIGINT', closeConnections);

/**
 * Check database health
 */
export const checkDatabaseHealth = async (): Promise<{
  postgres: boolean;
  chroma: boolean;
  details: any;
}> => {
  const health = {
    postgres: false,
    chroma: false,
    details: {} as any,
  };

  try {
    // Check PostgreSQL
    const pool = getPostgresPool();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    client.release();
    
    health.postgres = true;
    health.details.postgres = {
      connected: true,
      timestamp: result.rows[0].now,
      version: result.rows[0].version,
    };
  } catch (error) {
    health.details.postgres = {
      connected: false,
      error: (error as Error).message,
    };
  }

  try {
    // Check ChromaDB
    const chroma = getChromaClient();
    const heartbeat = await chroma.heartbeat();
    
    health.chroma = true;
    health.details.chroma = {
      connected: true,
      heartbeat: heartbeat,
    };
  } catch (error) {
    health.details.chroma = {
      connected: false,
      error: (error as Error).message,
    };
  }

  return health;
};

/**
 * Get agent by ID with organization validation
 */
export const getAgentById = async (
  agentId: string,
  organizationId: string
): Promise<any> => {
  const agents = await query(`
    SELECT 
      id,
      name,
      description,
      welcome_message as "welcomeMessage",
      fallback_message as "fallbackMessage",
      system_prompt as "systemPrompt",
      model_provider as "modelProvider",
      model_name as "modelName",
      temperature,
      max_tokens as "maxTokens",
      is_active as "isActive",
      settings,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM agents 
    WHERE id = $1 AND organization_id = $2 AND is_active = true
  `, [agentId, organizationId]);

  return agents[0] || null;
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  agentId: string,
  sessionId?: string,
  userId?: string,
  metadata: any = {}
): Promise<any> => {
  const conversations = await query(`
    INSERT INTO conversations (agent_id, session_id, user_id, metadata)
    VALUES ($1, $2, $3, $4)
    RETURNING 
      id,
      agent_id as "agentId",
      session_id as "sessionId",
      user_id as "userId",
      title,
      status,
      metadata,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, [agentId, sessionId, userId, JSON.stringify(metadata)]);

  return conversations[0];
};

/**
 * Add a message to a conversation
 */
export const addMessage = async (
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: any = {}
): Promise<any> => {
  const messages = await query(`
    INSERT INTO messages (conversation_id, role, content, metadata)
    VALUES ($1, $2, $3, $4)
    RETURNING 
      id,
      conversation_id as "conversationId",
      role,
      content,
      metadata,
      created_at as "createdAt"
  `, [conversationId, role, content, JSON.stringify(metadata)]);

  return messages[0];
};

/**
 * Get conversation messages
 */
export const getConversationMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<any[]> => {
  return await query(`
    SELECT 
      id,
      conversation_id as "conversationId",
      role,
      content,
      metadata,
      created_at as "createdAt"
    FROM messages
    WHERE conversation_id = $1
    ORDER BY created_at ASC
    LIMIT $2
  `, [conversationId, limit]);
};
