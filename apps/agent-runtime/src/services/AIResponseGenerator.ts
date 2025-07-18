import { logger } from '../utils/logger';
import { ChatMessage, RetrievedContext } from '../types/chat';

interface AIProvider {
  name: string;
  generateResponse(prompt: string, options?: Record<string, any>): Promise<string>;
}

export class AIResponseGenerator {
  private providers: AIProvider[] = [];
  private currentProvider: number = 0;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize available AI providers
   */
  private initializeProviders(): void {
    // Initialize Ollama provider
    if (process.env.OLLAMA_URL) {
      this.providers.push(new OllamaProvider());
    }

    // Initialize Bedrock provider
    if (process.env.AWS_REGION) {
      this.providers.push(new BedrockProvider());
    }

    // Initialize OpenAI provider
    if (process.env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider());
    }

    if (this.providers.length === 0) {
      logger.warn('No AI providers configured. Using fallback provider.');
      this.providers.push(new FallbackProvider());
    }

    logger.info({ providers: this.providers.map(p => p.name) }, 'AI providers initialized');
  }

  /**
   * Generate AI response with context and history
   */
  async generateResponse(
    userMessage: string,
    agentId: string,
    conversationHistory: ChatMessage[],
    retrievedContext: RetrievedContext[],
    systemPrompt?: string
  ): Promise<string> {
    const prompt = this.buildPrompt(
      userMessage,
      agentId,
      conversationHistory,
      retrievedContext,
      systemPrompt
    );

    // Try providers in order with fallback
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.providers[this.currentProvider];
      
      try {
        const response = await provider.generateResponse(prompt, {
          temperature: 0.7,
          maxTokens: 1000,
          agentId
        });

        logger.info({ 
          provider: provider.name, 
          agentId,
          promptLength: prompt.length,
          responseLength: response.length 
        }, 'AI response generated successfully');

        return response;
      } catch (error) {
        logger.error({ 
          error, 
          provider: provider.name, 
          agentId,
          attempt 
        }, 'AI provider failed, trying next');

        // Move to next provider
        this.currentProvider = (this.currentProvider + 1) % this.providers.length;
      }
    }

    // All providers failed, use fallback response
    logger.error({ agentId }, 'All AI providers failed, using fallback response');
    return this.getFallbackResponse();
  }

  /**
   * Build comprehensive prompt with context
   */
  private buildPrompt(
    userMessage: string,
    agentId: string,
    conversationHistory: ChatMessage[],
    retrievedContext: RetrievedContext[],
    systemPrompt?: string
  ): string {
    const sections = [];

    // System prompt
    if (systemPrompt) {
      sections.push(`System: ${systemPrompt}`);
    } else {
      sections.push(`System: You are a helpful AI assistant. Provide clear, accurate, and helpful responses.`);
    }

    // Retrieved context
    if (retrievedContext.length > 0) {
      sections.push('\n--- Relevant Context ---');
      retrievedContext.forEach((context, index) => {
        sections.push(`Context ${index + 1} (from ${context.source}, similarity: ${context.similarity.toFixed(2)}):`);
        sections.push(context.content);
      });
    }

    // Conversation history (last 5 messages for context)
    if (conversationHistory.length > 0) {
      sections.push('\n--- Conversation History ---');
      const recentHistory = conversationHistory.slice(-5);
      recentHistory.forEach(message => {
        const role = message.role === 'user' ? 'Human' : 'Assistant';
        sections.push(`${role}: ${message.content}`);
      });
    }

    // Current user message
    sections.push('\n--- Current Message ---');
    sections.push(`Human: ${userMessage}`);
    sections.push('\nAssistant:');

    return sections.join('\n');
  }

  /**
   * Get fallback response when all providers fail
   */
  private getFallbackResponse(): string {
    const fallbackResponses = [
      "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.",
      "I'm currently unable to process your request due to technical issues. Please try again later.",
      "Sorry, I'm having trouble connecting to my AI services. Please retry your question.",
      "I'm experiencing connectivity issues at the moment. Please try your request again."
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * Check if AI providers are healthy
   */
  async healthCheck(): Promise<{ provider: string; healthy: boolean; error?: string }[]> {
    const healthResults = [];

    for (const provider of this.providers) {
      try {
        await provider.generateResponse("Hello", { maxTokens: 10 });
        healthResults.push({ provider: provider.name, healthy: true });
      } catch (error) {
        healthResults.push({ 
          provider: provider.name, 
          healthy: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return healthResults;
  }
}

/**
 * Ollama Provider Implementation
 */
class OllamaProvider implements AIProvider {
  name = 'ollama';
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async generateResponse(prompt: string, options: Record<string, any> = {}): Promise<string> {
    const model = options.model || process.env.OLLAMA_MODEL || 'llama2';
    
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }
}

/**
 * AWS Bedrock Provider Implementation
 */
class BedrockProvider implements AIProvider {
  name = 'bedrock';

  async generateResponse(prompt: string, options: Record<string, any> = {}): Promise<string> {
    // Placeholder for AWS Bedrock implementation
    // In a real implementation, you'd use the AWS SDK
    throw new Error('Bedrock provider not yet implemented');
  }
}

/**
 * OpenAI Provider Implementation
 */
class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateResponse(prompt: string, options: Record<string, any> = {}): Promise<string> {
    const model = options.model || 'gpt-3.5-turbo';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

/**
 * Fallback Provider (Static Responses)
 */
class FallbackProvider implements AIProvider {
  name = 'fallback';

  async generateResponse(prompt: string, options: Record<string, any> = {}): Promise<string> {
    // Simple fallback responses based on prompt content
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return "Hello! How can I help you today?";
    }
    
    if (lowerPrompt.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    if (lowerPrompt.includes('help')) {
      return "I'm here to help! Please let me know what you need assistance with.";
    }
    
    return "I understand you're asking about something, but I'm currently running in fallback mode with limited capabilities. Please try again later when full AI services are available.";
  }
}
