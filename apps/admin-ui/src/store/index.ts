import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  organization_id: string
  organization: {
    id: string
    name: string
    slug: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
        localStorage.setItem('ragdoll_token', token)
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('ragdoll_token')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

// Global app state
interface AppState {
  sidebarOpen: boolean
  currentOrganization: string | null
  currentAgent: string | null
  setSidebarOpen: (open: boolean) => void
  setCurrentOrganization: (orgId: string) => void
  setCurrentAgent: (agentId: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  currentOrganization: null,
  currentAgent: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentOrganization: (orgId) => set({ currentOrganization: orgId }),
  setCurrentAgent: (agentId) => set({ currentAgent: agentId }),
}))

// Agent-specific state
interface AgentState {
  selectedAgent: any | null
  agentDocuments: { [agentId: string]: any[] }
  agentWorkflows: { [agentId: string]: any[] }
  agentKnowledgeBases: { [agentId: string]: any[] }
  setSelectedAgent: (agent: any) => void
  setAgentDocuments: (agentId: string, documents: any[]) => void
  setAgentWorkflows: (agentId: string, workflows: any[]) => void
  setAgentKnowledgeBases: (agentId: string, knowledgeBases: any[]) => void
  clearAgentData: (agentId: string) => void
}

export const useAgentStore = create<AgentState>((set) => ({
  selectedAgent: null,
  agentDocuments: {},
  agentWorkflows: {},
  agentKnowledgeBases: {},
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setAgentDocuments: (agentId, documents) => set((state) => ({
    agentDocuments: { ...state.agentDocuments, [agentId]: documents }
  })),
  setAgentWorkflows: (agentId, workflows) => set((state) => ({
    agentWorkflows: { ...state.agentWorkflows, [agentId]: workflows }
  })),
  setAgentKnowledgeBases: (agentId, knowledgeBases) => set((state) => ({
    agentKnowledgeBases: { ...state.agentKnowledgeBases, [agentId]: knowledgeBases }
  })),
  clearAgentData: (agentId) => set((state) => {
    const newDocuments = { ...state.agentDocuments }
    const newWorkflows = { ...state.agentWorkflows }
    const newKnowledgeBases = { ...state.agentKnowledgeBases }
    
    delete newDocuments[agentId]
    delete newWorkflows[agentId]
    delete newKnowledgeBases[agentId]
    
    return {
      agentDocuments: newDocuments,
      agentWorkflows: newWorkflows,
      agentKnowledgeBases: newKnowledgeBases
    }
  }),
}))
