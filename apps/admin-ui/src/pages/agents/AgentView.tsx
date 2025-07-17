import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  CpuChipIcon,
  DocumentIcon,
  PlayIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { formatDateTime } from '@/utils'

export function AgentView() {
  const { id } = useParams<{ id: string }>()
  
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => apiClient.getAgent(id!),
    enabled: !!id,
  })

  const { data: conversations } = useQuery({
    queryKey: ['conversations', id],
    queryFn: () => apiClient.getConversations(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-secondary-200 pb-4">
          <div className="h-8 bg-secondary-200 rounded animate-pulse w-48"></div>
          <div className="h-4 bg-secondary-200 rounded animate-pulse w-96 mt-2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
              <div className="animate-pulse">
                <div className="h-6 bg-secondary-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-secondary-200 rounded w-48"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!agent?.data) {
    return (
      <div className="space-y-6">
        <div className="border-b border-secondary-200 pb-4">
          <Link
            to="/agents"
            className="inline-flex items-center text-secondary-600 hover:text-secondary-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Agents
          </Link>
        </div>
        <div className="bg-white p-12 rounded-lg shadow-sm border border-secondary-200 text-center">
          <h3 className="text-lg font-medium text-secondary-900 mb-2">Agent not found</h3>
          <p className="text-secondary-600 mb-4">
            The agent you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/agents"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Go back to agents
          </Link>
        </div>
      </div>
    )
  }

  const agentData = agent.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-secondary-200 pb-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/agents"
            className="inline-flex items-center text-secondary-600 hover:text-secondary-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Agents
          </Link>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <CpuChipIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">{agentData.name}</h1>
              <p className="text-secondary-600 mt-1">{agentData.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  agentData.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {agentData.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-secondary-500">
                  Created {formatDateTime(agentData.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/agents/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Agent
            </Link>
          </div>
        </div>
      </div>

      {/* Agent Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Knowledge Base */}
        <Link
          to={`/agents/${id}/knowledge`}
          className="block bg-white p-6 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">Knowledge Base</h3>
                  <p className="text-sm text-secondary-600">Manage documents and sources</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary-900">0</p>
              <p className="text-xs text-secondary-600">Documents</p>
            </div>
          </div>
        </Link>

        {/* Workflows */}
        <Link
          to={`/agents/${id}/workflows`}
          className="block bg-white p-6 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <PlayIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">Workflows</h3>
                  <p className="text-sm text-secondary-600">Build conditional logic</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary-900">0</p>
              <p className="text-xs text-secondary-600">Workflows</p>
            </div>
          </div>
        </Link>

        {/* Conversations */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">Conversations</h3>
                  <p className="text-sm text-secondary-600">Active chat sessions</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary-900">
                {conversations?.data?.length || 0}
              </p>
              <p className="text-xs text-secondary-600">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Behavior */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Agent Behavior</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Welcome Message
              </label>
              <div className="bg-secondary-50 p-3 rounded-md">
                <p className="text-sm text-secondary-900">{agentData.welcomeMessage}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Fallback Message
              </label>
              <div className="bg-secondary-50 p-3 rounded-md">
                <p className="text-sm text-secondary-900">{agentData.fallbackMessage}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                System Prompt
              </label>
              <div className="bg-secondary-50 p-3 rounded-md max-h-32 overflow-y-auto">
                <p className="text-sm text-secondary-900">{agentData.systemPrompt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {conversations?.data?.slice(0, 5).map((conversation) => (
              <div key={conversation.id} className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-secondary-900">
                    Conversation started
                  </p>
                  <p className="text-xs text-secondary-500">
                    {formatDateTime(conversation.createdAt)}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600">No recent conversations</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to={`/agents/${id}/knowledge/upload`}
            className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
          >
            <DocumentIcon className="h-5 w-5 text-purple-500 mr-3" />
            <span className="text-sm font-medium text-secondary-900">Upload Documents</span>
          </Link>
          <Link
            to={`/agents/${id}/workflows`}
            className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
          >
            <PlayIcon className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-sm font-medium text-secondary-900">Create Workflow</span>
          </Link>
          <Link
            to={`/agents/${id}/edit`}
            className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
          >
            <Cog6ToothIcon className="h-5 w-5 text-blue-500 mr-3" />
            <span className="text-sm font-medium text-secondary-900">Edit Settings</span>
          </Link>
          <button className="flex items-center p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-orange-500 mr-3" />
            <span className="text-sm font-medium text-secondary-900">Test Agent</span>
          </button>
        </div>
      </div>
    </div>
  )
}
