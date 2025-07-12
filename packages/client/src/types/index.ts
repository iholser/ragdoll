// Document types
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filename: string;
    fileType: string;
    chunkIndex: number;
    totalChunks: number;
    createdAt: string;
  };
}

export interface DocumentUploadResponse {
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
  timestamp: string;
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
  timestamp: string;
  sources: DocumentChunk[];
  conversationId: string;
}

// Upload types
export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}
