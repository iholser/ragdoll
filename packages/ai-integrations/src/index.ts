import type { ChatRequest, ChatResponse } from '@ragdoll/shared-types';

// ==================== AI PROVIDER CONFIGURATION ====================

export interface AIProviderConfig {
  provider: 'bedrock' | 'ollama';
  model: string;
  apiKey?: string;
  region?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIProviderManager {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * Generate a chat response using the configured provider
   */
  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    try {
      if (this.config.provider === 'ollama') {
        return await this.generateOllamaResponse(messages, systemPrompt);
      } else if (this.config.provider === 'bedrock') {
        return await this.generateBedrockResponse(messages, systemPrompt);
      } else {
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate AI response: ${errorMessage}`);
    }
  }

  /**
   * Generate a streaming chat response
   */
  async generateStreamingResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemPrompt?: string
  ) {
    try {
      if (this.config.provider === 'ollama') {
        return await this.generateOllamaStreamingResponse(messages, systemPrompt);
      } else if (this.config.provider === 'bedrock') {
        return await this.generateBedrockStreamingResponse(messages, systemPrompt);
      } else {
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('Error generating streaming AI response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate streaming AI response: ${errorMessage}`);
    }
  }

  private async generateOllamaResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    // Build the prompt from messages
    let prompt = '';
    if (systemPrompt) {
      prompt += `System: ${systemPrompt}\n\n`;
    }
    
    for (const message of messages) {
      const roleLabel = message.role === 'user' ? 'Human' : 
                       message.role === 'assistant' ? 'Assistant' : 
                       'System';
      prompt += `${roleLabel}: ${message.content}\n\n`;
    }
    
    // Add assistant prompt
    prompt += 'Assistant:';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature || 0.7,
          num_predict: this.config.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || 'No response generated';
  }

  private async generateOllamaStreamingResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemPrompt?: string
  ) {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    // Build the prompt from messages
    let prompt = '';
    if (systemPrompt) {
      prompt += `System: ${systemPrompt}\n\n`;
    }
    
    for (const message of messages) {
      const roleLabel = message.role === 'user' ? 'Human' : 
                       message.role === 'assistant' ? 'Assistant' : 
                       'System';
      prompt += `${roleLabel}: ${message.content}\n\n`;
    }
    
    // Add assistant prompt
    prompt += 'Assistant:';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: true,
        options: {
          temperature: this.config.temperature || 0.7,
          num_predict: this.config.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    return this.createStreamFromResponse(response);
  }

  private async *createStreamFromResponse(response: Response) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                yield data.response;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async generateBedrockResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    // Placeholder for Bedrock implementation
    // This would use the AWS SDK for Bedrock
    throw new Error('Bedrock provider not yet implemented');
  }

  private async generateBedrockStreamingResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemPrompt?: string
  ) {
    // Placeholder for Bedrock streaming implementation
    throw new Error('Bedrock streaming provider not yet implemented');
  }
}

// ==================== EMBEDDING GENERATION ====================

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class BedrockEmbeddingProvider implements EmbeddingProvider {
  private model: string;

  constructor(model: string = 'amazon.titan-embed-text-v1') {
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Implementation for Bedrock embedding generation
    // This would use the AWS SDK for Bedrock
    throw new Error('Bedrock embedding provider not yet implemented');
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Batch embedding generation
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'nomic-embed-text') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }
}

// ==================== FACTORY FUNCTION ====================

/**
 * Factory function to create an AI provider instance
 */
export function createAIProvider(config: AIProviderConfig): AIProviderManager {
  return new AIProviderManager(config);
}

// ==================== UTILITY FUNCTIONS ====================

export function getDefaultAIConfig(): AIProviderConfig {
  const provider = process.env.AI_PROVIDER as 'bedrock' | 'ollama' || 'bedrock';
  
  switch (provider) {
    case 'bedrock':
      return {
        provider: 'bedrock',
        model: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
        region: process.env.AWS_REGION || 'us-east-1',
        temperature: 0.7,
        maxTokens: 1000,
      };
    case 'ollama':
      return {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'llama2:7b',
        baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 1000,
      };
    default:
      throw new Error(`Invalid AI provider: ${provider}`);
  }
}

export function validateAIConfig(config: AIProviderConfig): boolean {
  if (!config.provider || !config.model) {
    return false;
  }

  switch (config.provider) {
    case 'bedrock':
      return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    case 'ollama':
      return !!(config.baseUrl || process.env.OLLAMA_HOST);
    default:
      return false;
  }
}

// ==================== EXPORTS ====================

// Main exports are already defined above
