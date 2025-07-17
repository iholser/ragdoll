import { config } from './config';
import { logger } from './utils/logger';

console.log('Starting simple test...');
console.log('Config:', {
  NODE_ENV: config.NODE_ENV,
  PORT: config.PORT,
  HOST: config.HOST,
  AI_PROVIDER: config.AI_PROVIDER,
  OLLAMA_HOST: config.OLLAMA_HOST,
  OLLAMA_MODEL: config.OLLAMA_MODEL,
});

// Test AI provider
import { createAIProvider } from '@ragdoll/ai-integrations';

const aiProvider = createAIProvider({
  provider: config.AI_PROVIDER as 'ollama',
  model: config.OLLAMA_MODEL,
  baseUrl: config.OLLAMA_HOST,
  temperature: 0.7,
  maxTokens: 1000,
});

console.log('AI Provider created successfully');

// Test a simple AI request
async function testAI() {
  try {
    const response = await aiProvider.generateResponse([
      { role: 'user', content: 'Hello, how are you?' }
    ]);
    console.log('AI Response:', response);
  } catch (error) {
    console.error('AI Error:', error);
  }
}

testAI();
