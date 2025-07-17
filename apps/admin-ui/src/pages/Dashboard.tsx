import { useQuery } from '@tanstack/react-query'
import { 
  CpuChipIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { formatRelativeTime } from '@/utils'
import { apiClient } from '@/lib/api'

interface DashboardStats {
  totalAgents: number
  activeConversations: number
  totalDocuments: number
  totalUsers: number
  conversationChange: number
  documentsChange: number
}

interface RecentActivity {
  id: string
  type: 'agent_created' | 'conversation_started' | 'document_uploaded'
  title: string
  description: string
  timestamp: Date
  user: string
}

// Mock data - this would come from API
const mockStats: DashboardStats = {
  totalAgents: 12,
  activeConversations: 248,
  totalDocuments: 156,
  totalUsers: 8,
  conversationChange: 12.5,
  documentsChange: -2.1,
}

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'agent_created',
    title: 'New Agent Created',
    description: 'Customer Support Agent was created by John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: 'John Doe',
  },
  {
    id: '2',
    type: 'conversation_started',
    title: 'Conversation Started',
    description: 'New conversation with Sales Assistant',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    user: 'Anonymous User',
  },
  {
    id: '3',
    type: 'document_uploaded',
    title: 'Document Uploaded',
    description: 'FAQ.pdf uploaded to Knowledge Base',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: 'Jane Smith',
  },
]

const statCards = [
  {
    title: 'Total Agents',
    value: mockStats.totalAgents,
    icon: CpuChipIcon,
    color: 'bg-blue-500',
  },
  {
    title: 'Active Conversations',
    value: mockStats.activeConversations,
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-green-500',
    change: mockStats.conversationChange,
  },
  {
    title: 'Knowledge Base',
    value: mockStats.totalDocuments,
    icon: BookOpenIcon,
    color: 'bg-purple-500',
    change: mockStats.documentsChange,
  },
  {
    title: 'Total Users',
    value: mockStats.totalUsers,
    icon: UserGroupIcon,
    color: 'bg-orange-500',
  },
]

export function Dashboard() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
  })

  const { data: healthCheck } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-secondary-200 pb-4">
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-1">
          Welcome back! Here's what's happening with your agents.
        </p>
      </div>

      {/* System Status */}
      {healthCheck?.data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-green-800 font-medium">All systems operational</span>
            <span className="text-green-600 ml-2">
              • Last checked: {formatRelativeTime(healthCheck.data.timestamp)}
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{card.title}</p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">{card.value}</p>
                {card.change !== undefined && (
                  <div className="flex items-center mt-2">
                    {card.change > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${card.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(card.change)}% from last week
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900">{activity.title}</p>
                  <p className="text-sm text-secondary-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-secondary-500 mt-1">
                    {formatRelativeTime(activity.timestamp)} • {activity.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/agents/create"
              className="flex items-center p-3 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <CpuChipIcon className="h-5 w-5 text-blue-500 mr-3" />
              <span className="text-sm font-medium text-secondary-900">Create New Agent</span>
            </a>
            <a
              href="/knowledge/upload"
              className="flex items-center p-3 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <BookOpenIcon className="h-5 w-5 text-purple-500 mr-3" />
              <span className="text-sm font-medium text-secondary-900">Upload Documents</span>
            </a>
            <a
              href="/workflows"
              className="flex items-center p-3 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-sm font-medium text-secondary-900">Build Workflow</span>
            </a>
          </div>
        </div>
      </div>

      {/* Agents List Preview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Your Agents</h3>
          <a
            href="/agents"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            View all →
          </a>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-secondary-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {agents?.data?.slice(0, 3).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 rounded-lg border border-secondary-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CpuChipIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-secondary-900">{agent.name}</h4>
                    <p className="text-xs text-secondary-600">{agent.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    agent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
