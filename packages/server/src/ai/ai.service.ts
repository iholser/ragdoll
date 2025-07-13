
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { ollama } from 'ollama-ai-provider';

@Injectable()
export class AIService {
  private model: any | null;
  private modelId: string;
  private provider: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>('LLM_PROVIDER', 'bedrock');
    if (this.provider === 'ollama') {
      const ollamaModel = this.configService.get<string>('OLLAMA_MODEL', 'llama3.2');
      this.model = ollama(ollamaModel);
      this.modelId = ollamaModel;
    } else {
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
      const region = this.configService.get<string>('AWS_REGION', 'us-west-2');
      this.modelId = this.configService.get<string>('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0');
      if (!accessKeyId || !secretAccessKey || accessKeyId === 'demo_access_key' || secretAccessKey === 'demo_secret_key') {
        console.warn('AWS credentials not configured - AI responses will be mocked');
        this.model = null;
      } else {
        process.env.AWS_ACCESS_KEY_ID = accessKeyId;
        process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
        process.env.AWS_REGION = region;
        this.model = bedrock(this.modelId);
      }
    }
  }


  /**
   * Generates a chat response using the Bedrock model via the ai package.
   * Falls back to a mock response if credentials are not set.
   */
  async generateResponse(prompt: string, context: string): Promise<string> {
    if (!this.model) {
      // Return a mock response when no LLM is configured
      return `Mock AI Response: Based on the context provided, I can see you're asking about "${prompt}".\n\nIn a real implementation, this would be processed by the selected LLM using the following context:\n${context.substring(0, 200)}...\n\nTo enable real AI responses, please configure your LLM provider in the .env file.`;
    }
    try {
      const fullPrompt = this.buildPrompt(prompt, context);
      const result = await generateText({
        model: this.model,
        prompt: fullPrompt,
        maxTokens: parseInt(this.configService.get<string>('BEDROCK_MAX_TOKENS', '4096')),
        temperature: parseFloat(this.configService.get<string>('BEDROCK_TEMPERATURE', '0.7')),
      });
      return result.text;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Builds the prompt for the chat model.
   */
  private buildPrompt(userQuery: string, context: string): string {
    return `You are a helpful AI assistant that answers questions based on the provided context.
    Use the context below to answer the user's question. If the context doesn't contain enough information to answer the question, say so clearly.
    
    Context:\n${context}
    
    User Question: ${userQuery}
    
    Please provide a helpful and accurate answer based on the context provided.`;
  }
}
