import { AgentProfile, Organization, Conversation, Message } from '@ragdoll/shared-types'

// Type definitions for auth responses
export interface AuthData {
  user: {
    id: string;
    email: string;
    name: string;
    organization_id: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  token: string;
}

export interface SignupRequest {
  organizationName: string;
  organizationSlug: string;
  userEmail: string;
  userName: string;
  userPassword: string;
}

export interface JoinRequest {
  organizationId: string;
  userEmail: string;
  userName: string;
  userPassword: string;
}

const API_BASE_URL = 'http://localhost:3000/api'

interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('ragdoll_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        data,
        success: true,
      }
    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }
    }
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Authentication methods
  setToken(token: string) {
    this.token = token
    localStorage.setItem('ragdoll_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('ragdoll_token')
    localStorage.removeItem('ragdoll_user')
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthData>> {
    return this.post<AuthData>('/auth/login', { email, password })
  }

  async signup(data: SignupRequest): Promise<ApiResponse<AuthData>> {
    return this.post<AuthData>('/auth/signup', data)
  }

  async joinOrganization(data: JoinRequest): Promise<ApiResponse<AuthData>> {
    return this.post<AuthData>('/auth/join', data)
  }

  async getCurrentUser() {
    return this.get('/auth/me')
  }

  async logout() {
    return this.post('/auth/logout')
  }

  // Agent methods
  async getAgents(): Promise<ApiResponse<AgentProfile[]>> {
    return this.request<AgentProfile[]>('/agents')
  }

  async getAgent(id: string): Promise<ApiResponse<AgentProfile>> {
    return this.request<AgentProfile>(`/agents/${id}`)
  }

  async createAgent(agent: Partial<AgentProfile>): Promise<ApiResponse<AgentProfile>> {
    return this.request<AgentProfile>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    })
  }

  async updateAgent(id: string, agent: Partial<AgentProfile>): Promise<ApiResponse<AgentProfile>> {
    return this.request<AgentProfile>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    })
  }

  async deleteAgent(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/agents/${id}`, {
      method: 'DELETE',
    })
  }

  // Organization methods
  async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    return this.request<Organization[]>('/organizations')
  }

  async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    return this.request<Organization>(`/organizations/${id}`)
  }

  // Conversation methods
  async getConversations(agentId?: string): Promise<ApiResponse<Conversation[]>> {
    const query = agentId ? `?agentId=${agentId}` : ''
    return this.request<Conversation[]>(`/conversations${query}`)
  }

  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>(`/conversations/${id}`)
  }

  async getConversationMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return this.request<Message[]>(`/conversations/${conversationId}/messages`)
  }

  // Chat methods
  async sendMessage(agentId: string, message: string, conversationId?: string): Promise<ApiResponse<{ response: string; conversationId: string }>> {
    return this.request<{ response: string; conversationId: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId,
        message,
        conversationId,
      }),
    })
  }

  // Document methods
  async uploadDocument(file: File, knowledgeBaseId: string): Promise<ApiResponse<{ id: string; filename: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('knowledgeBaseId', knowledgeBaseId)

    return this.request<{ id: string; filename: string }>('/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    })
  }

  async getDocuments(knowledgeBaseId?: string): Promise<ApiResponse<any[]>> {
    const query = knowledgeBaseId ? `?knowledgeBaseId=${knowledgeBaseId}` : ''
    return this.request<any[]>(`/documents${query}`)
  }

  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/documents/${id}`, {
      method: 'DELETE',
    })
  }

  // Agent-specific document methods
  async getAgentDocuments(agentId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/agents/${agentId}/documents`)
  }

  async uploadAgentDocument(agentId: string, file: File, knowledgeBaseId: string): Promise<ApiResponse<{ id: string; filename: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('knowledgeBaseId', knowledgeBaseId)

    return this.request<{ id: string; filename: string }>(`/agents/${agentId}/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    })
  }

  async deleteAgentDocument(agentId: string, documentId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/agents/${agentId}/documents/${documentId}`, {
      method: 'DELETE',
    })
  }

  // Agent-specific knowledge base methods
  async getAgentKnowledgeBases(agentId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/agents/${agentId}/knowledge-bases`)
  }

  async createAgentKnowledgeBase(agentId: string, knowledgeBase: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/knowledge-bases`, {
      method: 'POST',
      body: JSON.stringify(knowledgeBase),
    })
  }

  async updateAgentKnowledgeBase(agentId: string, knowledgeBaseId: string, knowledgeBase: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/knowledge-bases/${knowledgeBaseId}`, {
      method: 'PUT',
      body: JSON.stringify(knowledgeBase),
    })
  }

  async deleteAgentKnowledgeBase(agentId: string, knowledgeBaseId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/agents/${agentId}/knowledge-bases/${knowledgeBaseId}`, {
      method: 'DELETE',
    })
  }

  // Agent-specific workflow methods
  async getAgentWorkflows(agentId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/agents/${agentId}/workflows`)
  }

  async createAgentWorkflow(agentId: string, workflow: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(workflow),
    })
  }

  async updateAgentWorkflow(agentId: string, workflowId: string, workflow: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    })
  }

  async deleteAgentWorkflow(agentId: string, workflowId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/agents/${agentId}/workflows/${workflowId}`, {
      method: 'DELETE',
    })
  }

  async getAgentWorkflow(agentId: string, workflowId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/workflows/${workflowId}`)
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }
}

export const apiClient = new ApiClient()
export default apiClient
