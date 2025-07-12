import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { VectorService } from '../vector/vector.service';
import { AIService } from '../ai/ai.service';
import { ChatRequest, ChatResponse } from '../common/types';

@Injectable()
export class ChatService {
  private maxRetrievedChunks: number;
  private similarityThreshold: number;

  constructor(
    private readonly vectorService: VectorService,
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {
    this.maxRetrievedChunks = parseInt(
      this.configService.get<string>('MAX_RETRIEVED_CHUNKS', '5')
    );
    this.similarityThreshold = parseFloat(
      this.configService.get<string>('SIMILARITY_THRESHOLD', '0.7')
    );
  }

  async processMessage(chatRequest: ChatRequest): Promise<ChatResponse> {
    try {
      // Search for relevant chunks in vector database
      const searchResults = await this.vectorService.searchSimilar({
        query: chatRequest.message,
        topK: this.maxRetrievedChunks,
        threshold: this.similarityThreshold,
      });

      console.log(searchResults);

      // Build context from retrieved chunks
      const context = searchResults
        .map(result => `Source: ${result.chunk.metadata.filename}\nContent: ${result.chunk.content}`)
        .join('\n\n---\n\n');

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        chatRequest.message,
        context
      );

      // Create chat response
      const response: ChatResponse = {
        id: uuidv4(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        sources: searchResults.map(result => result.chunk),
        conversationId: chatRequest.conversationId || uuidv4(),
      };

      return response;
    } catch (error) {
      console.error('Error processing chat message:', error);
      throw new Error('Failed to process chat message');
    }
  }
}
