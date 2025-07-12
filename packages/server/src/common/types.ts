// Document processing types
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filename: string;
    fileType: string;
    chunkIndex: number;
    totalChunks: number;
    createdAt: Date;
  };
  embedding?: number[];
}

export interface ProcessedDocument {
  id: string;
  filename: string;
  fileType: string;
  chunks: DocumentChunk[];
  createdAt: Date;
}

export interface DocumentUploadResult {
  id: string;
  filename: string;
  fileType: string;
  totalChunks: number;
  message: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: DocumentChunk[];
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: Date;
  sources: DocumentChunk[];
  conversationId: string;
}

// Vector search types
export interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface VectorSearchQuery {
  query: string;
  topK?: number;
  threshold?: number;
}
