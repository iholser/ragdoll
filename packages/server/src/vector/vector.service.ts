import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from "chromadb";
import { embed } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { ollama } from 'ollama-ai-provider';
import { DocumentChunk, VectorSearchResult, VectorSearchQuery } from '../common/types';

@Injectable()
export class VectorService {
  private chroma: ChromaClient | null;
  private collection: Collection | null;
  private collectionName: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('CHROMADB_HOST', 'localhost');
    const port = this.configService.get<string>('CHROMADB_PORT', '8000');
    const provider = this.configService.get<string>('LLM_PROVIDER', 'bedrock');
    this.collectionName = `${this.configService.get<string>('CHROMADB_COLLECTION', 'ragdoll-documents')}-${provider}`;

    try {
      this.chroma = new ChromaClient({
        path: `http://${host}:${port}`,
      });
      this.collection = null;
      this.chroma.getOrCreateCollection({ name: this.collectionName })
        .then((col) => {
          this.collection = col;
        })
        .catch((err) => {
          console.error('Error initializing ChromaDB collection:', err);
          this.collection = null;
        });
    } catch (err) {
      console.error('Error connecting to ChromaDB:', err);
      this.chroma = null;
      this.collection = null;
    }
  }

  async storeChunk(chunk: DocumentChunk): Promise<void> {
    if (!this.collection) {
      console.warn('ChromaDB not configured - skipping chunk storage');
      return;
    }
    try {
      if (!chunk.embedding) {
        throw new Error('Chunk must have embedding before storing');
      }
      await this.collection.add({
        ids: [chunk.id],
        embeddings: [chunk.embedding],
        metadatas: [{
          content: chunk.content,
          filename: chunk.metadata.filename,
          fileType: chunk.metadata.fileType,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          createdAt: chunk.metadata.createdAt.toISOString(),
        }],
        documents: [chunk.content],
      });
    } catch (error) {
      console.error('Error storing chunk in ChromaDB:', error);
      throw new Error('Failed to store chunk in ChromaDB');
    }
  }

  async searchSimilar(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    if (!this.collection) {
      console.warn('ChromaDB not configured - returning empty results');
      return [];
    }
    try {
      const queryEmbedding = await this.generateEmbedding(query.query);
      const nResults = query.topK || 5;
      const threshold = query.threshold || 0.7;
      const results: VectorSearchResult[] = [];
      const searchResults = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults,
        include: ['metadatas', 'distances', 'documents'],
      });
      const ids = searchResults.ids?.[0] || [];
      const metadatas = searchResults.metadatas?.[0] || [];
      const distances = searchResults.distances?.[0] || [];
      for (let i = 0; i < ids.length; i++) {
        const similarity = 1 - (distances[i] ?? 1);
        // if (similarity > threshold) {}
        const meta = metadatas[i] || {};
        const chunk: DocumentChunk = {
          id: ids[i],
          content: meta.content as string,
          metadata: {
            filename: meta.filename as string,
            fileType: meta.fileType as string,
            chunkIndex: meta.chunkIndex as number,
            totalChunks: meta.totalChunks as number,
            createdAt: new Date(meta.createdAt as string),
          },
        };
        results.push({
          chunk,
          score: similarity,
        });
      }
      return results;
    } catch (error) {
      console.error('Error searching ChromaDB:', error);
      throw new Error('Failed to search ChromaDB');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const provider = this.configService.get<string>('LLM_PROVIDER', 'bedrock');
    console.log('Using LLM provider for embedding:', provider);
    if (provider === 'ollama') {
      const ollamaModel = this.configService.get<string>('EMBEDDING_MODEL', 'llama3.2');
      const model = ollama.embedding(ollamaModel);
      const result = await embed({
        model,
        value: text,
      });
      if (!result.embedding) {
        throw new Error('No embedding returned from Ollama');
      }
      return result.embedding;
    } else {
      const modelId = this.configService.get<string>('EMBEDDING_MODEL', 'amazon.titan-embed-text-v1');
      const model = bedrock.embedding(modelId);
      const result = await embed({
        model,
        value: text,
      });
      if (!result.embedding) {
        throw new Error('No embedding returned from Bedrock');
      }
      return result.embedding;
    }
  }
}
