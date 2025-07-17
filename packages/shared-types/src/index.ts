import { z } from 'zod';
import { Type, Static } from '@sinclair/typebox';

// ==================== AGENT TYPES ====================

export const AgentProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  welcomeMessage: z.string().min(1),
  fallbackMessage: z.string().min(1),
  systemPrompt: z.string().min(1),
  isActive: z.boolean().default(true),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;

export const CreateAgentRequestSchema = AgentProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;

// ==================== KNOWLEDGE BASE TYPES ====================

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  content: z.string(),
  chunks: z.array(z.string()).optional(),
  agentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const ChunkSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  content: z.string(),
  embedding: z.array(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
  position: z.number(),
  createdAt: z.date(),
});

export type Chunk = z.infer<typeof ChunkSchema>;

// ==================== WORKFLOW TYPES ====================

export const ConditionTypeEnum = z.enum([
  'intent',
  'sentiment',
  'keyword',
  'entity',
  'custom',
]);

export const ActionTypeEnum = z.enum([
  'webhook',
  'email',
  'ticket',
  'escalate',
  'transfer',
  'custom',
]);

export const WorkflowConditionSchema = z.object({
  id: z.string().uuid(),
  type: ConditionTypeEnum,
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'regex']),
  value: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type WorkflowCondition = z.infer<typeof WorkflowConditionSchema>;

export const WorkflowActionSchema = z.object({
  id: z.string().uuid(),
  type: ActionTypeEnum,
  name: z.string(),
  config: z.record(z.unknown()),
  priority: z.number().default(0),
});

export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  agentId: z.string().uuid(),
  conditions: z.array(WorkflowConditionSchema),
  actions: z.array(WorkflowActionSchema),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// ==================== CHAT TYPES ====================

export const MessageRoleEnum = z.enum(['user', 'assistant', 'system']);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: MessageRoleEnum,
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  agentId: z.string().uuid(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  message: z.string(),
  sources: z.array(z.object({
    documentId: z.string().uuid(),
    chunkId: z.string().uuid(),
    content: z.string(),
    score: z.number(),
  })).optional(),
  actionsTriggered: z.array(z.object({
    actionId: z.string().uuid(),
    actionType: ActionTypeEnum,
    status: z.enum(['success', 'failed', 'pending']),
    result: z.record(z.unknown()).optional(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ==================== ORGANIZATION TYPES ====================

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  settings: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  organizationId: z.string().uuid(),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// ==================== API RESPONSE TYPES ====================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// ==================== TYPEBOX SCHEMAS FOR FASTIFY ====================

export const AgentProfileTypebox = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.Optional(Type.String()),
  welcomeMessage: Type.String({ minLength: 1 }),
  fallbackMessage: Type.String({ minLength: 1 }),
  systemPrompt: Type.String({ minLength: 1 }),
  isActive: Type.Boolean(),
  organizationId: Type.String({ format: 'uuid' }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const ChatRequestTypebox = Type.Object({
  message: Type.String({ minLength: 1 }),
  conversationId: Type.Optional(Type.String({ format: 'uuid' })),
  agentId: Type.String({ format: 'uuid' }),
  sessionId: Type.Optional(Type.String()),
  userId: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

export const ChatResponseTypebox = Type.Object({
  id: Type.String({ format: 'uuid' }),
  conversationId: Type.String({ format: 'uuid' }),
  message: Type.String(),
  sources: Type.Optional(Type.Array(Type.Object({
    documentId: Type.String({ format: 'uuid' }),
    chunkId: Type.String({ format: 'uuid' }),
    content: Type.String(),
    score: Type.Number(),
  }))),
  actionsTriggered: Type.Optional(Type.Array(Type.Object({
    actionId: Type.String({ format: 'uuid' }),
    actionType: Type.Union([
      Type.Literal('webhook'),
      Type.Literal('email'),
      Type.Literal('ticket'),
      Type.Literal('escalate'),
      Type.Literal('transfer'),
      Type.Literal('custom'),
    ]),
    status: Type.Union([
      Type.Literal('success'),
      Type.Literal('failed'),
      Type.Literal('pending'),
    ]),
    result: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  }))),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  createdAt: Type.String({ format: 'date-time' }),
});

// ==================== WIDGET TYPES ====================

export const WidgetConfigSchema = z.object({
  agentId: z.string().uuid(),
  title: z.string().default('Chat with us'),
  placeholder: z.string().default('Type your message...'),
  primaryColor: z.string().default('#3B82F6'),
  position: z.enum(['bottom-right', 'bottom-left']).default('bottom-right'),
  showAvatar: z.boolean().default(true),
  showTimestamp: z.boolean().default(true),
  allowFileUpload: z.boolean().default(false),
  maxMessages: z.number().default(50),
  apiEndpoint: z.string().url(),
  customStyles: z.record(z.string()).optional(),
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

// ==================== EXPORTS ====================

// Re-export commonly used types and schemas
export {
  type Static,
  type TSchema,
} from '@sinclair/typebox';
