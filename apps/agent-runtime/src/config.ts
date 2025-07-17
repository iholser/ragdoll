import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

// Configuration schema
const configSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // Database configuration
  DATABASE_URL: z.string().min(1),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('ragdoll'),
  POSTGRES_USER: z.string().default('ragdoll'),
  POSTGRES_PASSWORD: z.string().default('ragdoll'),
  
  // ChromaDB configuration
  CHROMA_HOST: z.string().default('localhost'),
  CHROMA_PORT: z.coerce.number().default(8000),
  CHROMA_DB_IMPL: z.string().default('duckdb+parquet'),
  CHROMA_PERSIST_DIRECTORY: z.string().default('./chroma_data'),
  
  // AI Provider configuration
  AI_PROVIDER: z.enum(['bedrock', 'ollama']).default('bedrock'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-sonnet-20240229-v1:0'),
  OLLAMA_HOST: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama2:7b'),
  
  // Security configuration
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  
  // File upload configuration
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,txt,md'),
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // External integrations
  ZENDESK_SUBDOMAIN: z.string().optional(),
  ZENDESK_EMAIL: z.string().optional(),
  ZENDESK_API_TOKEN: z.string().optional(),
  SES_FROM_EMAIL: z.string().optional(),
  SES_REGION: z.string().default('us-east-1'),
  WEBHOOK_SECRET: z.string().optional(),
  
  // Logging configuration
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

// Parse and validate configuration
const parseConfig = () => {
  try {
    const parsed = configSchema.parse(process.env);
    
    // Derive additional configuration
    const corsOrigins = parsed.CORS_ORIGIN.split(',').map(origin => origin.trim());
    const allowedFileTypes = parsed.ALLOWED_FILE_TYPES.split(',').map(type => type.trim());
    
    return {
      ...parsed,
      CORS_ORIGINS: corsOrigins,
      ALLOWED_FILE_TYPES: allowedFileTypes,
    };
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
};

export const config = parseConfig();

// Export types
export type Config = ReturnType<typeof parseConfig>;

// Helper functions
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProduction = () => config.NODE_ENV === 'production';
export const isTest = () => config.NODE_ENV === 'test';

// Validate required environment variables based on provider
export const validateProviderConfig = () => {
  if (config.AI_PROVIDER === 'bedrock') {
    if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are required for Bedrock provider');
    }
  }
  
  if (config.AI_PROVIDER === 'ollama') {
    if (!config.OLLAMA_HOST) {
      throw new Error('OLLAMA_HOST is required for Ollama provider');
    }
  }
};

// Database connection string
export const getDatabaseUrl = () => {
  return config.DATABASE_URL || 
    `postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB}`;
};

// ChromaDB connection
export const getChromaConfig = () => {
  return {
    host: config.CHROMA_HOST,
    port: config.CHROMA_PORT,
    path: `http://${config.CHROMA_HOST}:${config.CHROMA_PORT}`,
    dbImpl: config.CHROMA_DB_IMPL,
    persistDirectory: config.CHROMA_PERSIST_DIRECTORY,
  };
};
