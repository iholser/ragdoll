export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatConversation {
  id: string;
  agentId: string;
  sessionId?: string;
  title?: string;
  status: 'active' | 'closed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  sessionId: string;
  actionsTriggered?: ActionResult[];
  metadata?: Record<string, any>;
}

export interface ActionResult {
  id: string;
  conditionId: string;
  actionType: string;
  success: boolean;
  executionTime: number;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface RetrievedContext {
  id: string;
  content: string;
  source: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface WorkflowCondition {
  id: string;
  name: string;
  triggerType: 'keyword' | 'regex' | 'sentiment' | 'intent' | 'length' | 'metadata';
  triggerConfig: Record<string, any>;
  actionType: 'webhook' | 'email' | 'tag' | 'escalate' | 'custom_response';
  actionConfig: Record<string, any>;
  isActive: boolean;
  priority: number;
}
