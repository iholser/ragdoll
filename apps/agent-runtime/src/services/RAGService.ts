import { logger } from '../utils/logger';
import { RetrievedContext } from '../types/chat';

export class RAGService {
  private chromaClient: any; // Using any due to ChromaDB type export issues
  private collectionName: string;
  private isAvailable: boolean = false;

  constructor() {
    this.collectionName = 'agent_knowledge_base';
    
    // Initialize ChromaDB client with error handling
    try {
      const { ChromaApi } = require('chromadb');
      this.chromaClient = new ChromaApi({
        path: process.env.CHROMA_URL || 'http://localhost:8000'
      });
      this.isAvailable = true;
    } catch (error) {
      logger.warn('ChromaDB not available - RAG service will operate in degraded mode');
      this.isAvailable = false;
    }
  }

  /**
   * Initialize the RAG service and ensure collection exists
   */
  async initialize(): Promise<void> {
    if (!this.isAvailable) {
      logger.warn('ChromaDB not available - RAG service initialization skipped');
      return;
    }

    try {
      // Try to get the collection, create if it doesn't exist
      try {
        await this.chromaClient.getCollection({
          name: this.collectionName
        });
        logger.info({ collection: this.collectionName }, 'ChromaDB collection found');
      } catch (error) {
        // Collection doesn't exist, create it
        await this.chromaClient.createCollection({
          name: this.collectionName,
          metadata: { 
            description: 'Agent knowledge base for RAG retrieval',
            created_at: new Date().toISOString()
          }
        });
        logger.info({ collection: this.collectionName }, 'ChromaDB collection created');
      }
    } catch (error) {
      logger.warn({ error, collection: this.collectionName }, 'ChromaDB not available - RAG service will operate in degraded mode');
      this.isAvailable = false;
    }
  }

  /**
   * Retrieve relevant context for a query
   */
  async retrieveContext(
    query: string, 
    agentId: string,
    maxResults: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<RetrievedContext[]> {
    if (!this.isAvailable) {
      logger.debug('ChromaDB not available - returning empty context');
      return [];
    }

    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName
      });

      // Query with agent-specific filtering
      const results = await collection.query({
        queryTexts: [query],
        nResults: maxResults,
        where: { agent_id: agentId },
        include: ['documents', 'metadatas', 'distances']
      });

      const retrievedContexts: RetrievedContext[] = [];

      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances?.[0]?.[i];
          const similarity = distance ? 1 - distance : 0;
          
          // Filter by similarity threshold
          if (similarity >= similarityThreshold) {
            const metadata = results.metadatas?.[0]?.[i] as Record<string, any> || {};
            const documentId = results.ids?.[0]?.[i] || `doc_${i}`;
            
            retrievedContexts.push({
              id: documentId,
              content: results.documents[0][i] || '',
              similarity,
              source: metadata.source || 'unknown',
              metadata: {
                ...metadata,
                retrievedAt: new Date().toISOString(),
                query
              }
            });
          }
        }
      }

      logger.debug({ 
        query, 
        agentId, 
        resultsCount: retrievedContexts.length,
        threshold: similarityThreshold 
      }, 'Context retrieved via RAG');

      return retrievedContexts;
    } catch (error) {
      logger.error({ error, query, agentId }, 'Failed to retrieve context via RAG');
      return []; // Return empty array on failure, don't break the chat
    }
  }

  /**
   * Add knowledge to the vector store
   */
  async addKnowledge(
    agentId: string,
    content: string,
    source: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName
      });

      const documentId = `${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await collection.add({
        ids: [documentId],
        documents: [content],
        metadatas: [{
          agent_id: agentId,
          source,
          added_at: new Date().toISOString(),
          ...metadata
        }]
      });

      logger.info({ 
        agentId, 
        source, 
        documentId,
        contentLength: content.length 
      }, 'Knowledge added to vector store');
    } catch (error) {
      logger.error({ error, agentId, source }, 'Failed to add knowledge to vector store');
      throw error;
    }
  }

  /**
   * Update knowledge in the vector store
   */
  async updateKnowledge(
    documentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName
      });

      await collection.update({
        ids: [documentId],
        documents: [content],
        metadatas: [{
          ...metadata,
          updated_at: new Date().toISOString()
        }]
      });

      logger.info({ documentId }, 'Knowledge updated in vector store');
    } catch (error) {
      logger.error({ error, documentId }, 'Failed to update knowledge in vector store');
      throw error;
    }
  }

  /**
   * Delete knowledge from the vector store
   */
  async deleteKnowledge(documentId: string): Promise<void> {
    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName
      });

      await collection.delete({
        ids: [documentId]
      });

      logger.info({ documentId }, 'Knowledge deleted from vector store');
    } catch (error) {
      logger.error({ error, documentId }, 'Failed to delete knowledge from vector store');
      throw error;
    }
  }

  /**
   * Search knowledge by agent ID
   */
  async searchKnowledgeByAgent(
    agentId: string,
    limit: number = 100
  ): Promise<Array<{ id: string; content: string; metadata: Record<string, any> }>> {
    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName
      });

      const results = await collection.get({
        where: { agent_id: agentId },
        limit,
        include: ['documents', 'metadatas']
      });

      const knowledge: Array<{ id: string; content: string; metadata: Record<string, any> }> = [];

      if (results.ids && results.documents && results.metadatas) {
        for (let i = 0; i < results.ids.length; i++) {
          knowledge.push({
            id: results.ids[i],
            content: results.documents[i] || '',
            metadata: results.metadatas[i] as Record<string, any> || {}
          });
        }
      }

      return knowledge;
    } catch (error) {
      logger.error({ error, agentId }, 'Failed to search knowledge by agent');
      return [];
    }
  }
}
