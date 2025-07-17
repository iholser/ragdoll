import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { AgentsList } from '@/pages/agents/AgentsList'
import { AgentCreate } from '@/pages/agents/AgentCreate'
import { AgentEdit } from '@/pages/agents/AgentEdit'
import { AgentView } from '@/pages/agents/AgentView'
import { KnowledgeBase } from '@/pages/knowledge/KnowledgeBase'
import { DocumentUpload } from '@/pages/knowledge/DocumentUpload'
import { WorkflowBuilder } from '@/pages/workflows/WorkflowBuilder'
import { Settings } from '@/pages/Settings'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { JoinOrganizationPage } from '@/pages/auth/JoinOrganizationPage'

export function AppRouter() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/join" element={<JoinOrganizationPage />} />
      
      {/* Main app routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        
        {/* Agents */}
        <Route path="agents" element={<AgentsList />} />
        <Route path="agents/create" element={<AgentCreate />} />
        <Route path="agents/:id" element={<AgentView />} />
        <Route path="agents/:id/edit" element={<AgentEdit />} />
        
        {/* Agent-specific Knowledge Base */}
        <Route path="agents/:agentId/knowledge" element={<KnowledgeBase />} />
        <Route path="agents/:agentId/knowledge/upload" element={<DocumentUpload />} />
        
        {/* Agent-specific Workflows */}
        <Route path="agents/:agentId/workflows" element={<WorkflowBuilder />} />
        
        {/* Global routes (for backward compatibility) */}
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="knowledge/upload" element={<DocumentUpload />} />
        <Route path="workflows" element={<WorkflowBuilder />} />
        
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
