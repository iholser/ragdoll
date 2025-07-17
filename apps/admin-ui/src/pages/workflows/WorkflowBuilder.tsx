import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  PlayIcon, 
  PlusIcon, 
  CpuChipIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action'
  title: string
  description: string
  config: any
  position: { x: number; y: number }
}

interface WorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
}

// Mock workflow data
const mockWorkflow: WorkflowNode[] = [
  {
    id: '1',
    type: 'trigger',
    title: 'User Message',
    description: 'Triggered when user sends a message',
    config: {},
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'condition',
    title: 'Sentiment Analysis',
    description: 'Check if message sentiment is negative',
    config: { sentiment: 'negative' },
    position: { x: 400, y: 100 },
  },
  {
    id: '3',
    type: 'action',
    title: 'Create Support Ticket',
    description: 'Create a ticket in the support system',
    config: { webhook: 'https://api.support.com/tickets' },
    position: { x: 700, y: 50 },
  },
  {
    id: '4',
    type: 'action',
    title: 'Send Response',
    description: 'Send AI-generated response to user',
    config: {},
    position: { x: 700, y: 150 },
  },
]

const mockConnections: WorkflowConnection[] = [
  { id: 'c1', source: '1', target: '2' },
  { id: 'c2', source: '2', target: '3', label: 'Negative' },
  { id: 'c3', source: '2', target: '4', label: 'Positive' },
]

export function WorkflowBuilder() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [workflows, setWorkflows] = useState(mockWorkflow)
  const [connections] = useState(mockConnections)

  // Fetch agent details for context
  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentId ? apiClient.getAgent(agentId) : Promise.resolve(null),
    enabled: !!agentId,
  })

  // Fetch agent workflows
  const { data: agentWorkflows } = useQuery({
    queryKey: ['agent-workflows', agentId],
    queryFn: () => agentId ? apiClient.getAgentWorkflows(agentId) : Promise.resolve(null),
    enabled: !!agentId,
  })

  // Update local workflows when agent workflows are loaded
  useEffect(() => {
    if (agentWorkflows?.data && agentWorkflows.data.length > 0) {
      // Use the first workflow or create a new one
      const workflow = agentWorkflows.data[0]
      if (workflow.nodes) {
        setWorkflows(workflow.nodes)
      }
    }
  }, [agentWorkflows])

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      if (agentId) {
        return apiClient.createAgentWorkflow(agentId, workflowData)
      }
      throw new Error('No agent ID provided')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-workflows', agentId] })
      toast.success('Workflow saved successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save workflow')
    },
  })

  const handleSaveWorkflow = async () => {
    try {
      await saveWorkflowMutation.mutateAsync({
        name: 'Customer Service Workflow',
        nodes: workflows,
        connections: connections,
        status: 'active',
      })
    } catch (error) {
      // Error handling is done in mutation
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return PlayIcon
      case 'condition':
        return CheckCircleIcon
      case 'action':
        return CpuChipIcon
      default:
        return PlayIcon
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'condition':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'action':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-secondary-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              {agentId && (
                <button
                  onClick={() => navigate(`/agents/${agentId}`)}
                  className="inline-flex items-center text-secondary-600 hover:text-secondary-900"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Agent
                </button>
              )}
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mt-2">Workflow Builder</h1>
            <p className="text-secondary-600 mt-1">
              {agentId && agent?.data 
                ? `Create conditional workflows for ${agent.data.name}`
                : 'Create conditional workflows for your agents'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSaveWorkflow}
              disabled={saveWorkflowMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {saveWorkflowMutation.isPending ? 'Saving...' : 'Save Workflow'}
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
            <div className="p-4 border-b border-secondary-200">
              <h3 className="text-lg font-medium text-secondary-900">
                Customer Support Workflow
              </h3>
              <p className="text-sm text-secondary-600 mt-1">
                Automatically create support tickets for negative feedback
              </p>
            </div>
            
            {/* Canvas */}
            <div className="relative h-96 bg-secondary-50 overflow-hidden">
              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full" style={{
                  backgroundImage: `radial-gradient(circle, #6b7280 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>

              {/* Workflow Nodes */}
              {workflows.map((node) => {
                const Icon = getNodeIcon(node.type)
                return (
                  <div
                    key={node.id}
                    className={`absolute cursor-pointer transition-all ${
                      selectedNode?.id === node.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: '200px',
                    }}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className={`p-3 rounded-lg border-2 ${getNodeColor(node.type)} bg-white`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{node.title}</span>
                      </div>
                      <p className="text-xs text-secondary-600">{node.description}</p>
                    </div>
                  </div>
                )
              })}

              {/* Connections */}
              <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                {connections.map((connection) => {
                  const sourceNode = workflows.find(n => n.id === connection.source)
                  const targetNode = workflows.find(n => n.id === connection.target)
                  
                  if (!sourceNode || !targetNode) return null

                  const startX = sourceNode.position.x + 200
                  const startY = sourceNode.position.y + 25
                  const endX = targetNode.position.x
                  const endY = targetNode.position.y + 25

                  return (
                    <g key={connection.id}>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      {connection.label && (
                        <text
                          x={(startX + endX) / 2}
                          y={(startY + endY) / 2 - 5}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#6b7280"
                          className="bg-white"
                        >
                          {connection.label}
                        </text>
                      )}
                    </g>
                  )
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Node Library */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Components</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary-50 cursor-pointer">
                <PlayIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm">Trigger</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary-50 cursor-pointer">
                <CheckCircleIcon className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Condition</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary-50 cursor-pointer">
                <CpuChipIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Action</span>
              </div>
            </div>
          </div>

          {/* Node Properties */}
          {selectedNode && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-secondary-900">Properties</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={selectedNode.description}
                    rows={3}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    readOnly
                  />
                </div>

                {selectedNode.type === 'condition' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Condition Type
                    </label>
                    <select className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Sentiment Analysis</option>
                      <option>Keyword Detection</option>
                      <option>Intent Recognition</option>
                    </select>
                  </div>
                )}

                {selectedNode.type === 'action' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Action Type
                    </label>
                    <select className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Create Ticket</option>
                      <option>Send Email</option>
                      <option>Call Webhook</option>
                      <option>Transfer to Human</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workflow Actions */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center space-x-2 p-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
                <PlayIcon className="h-4 w-4" />
                <span>Test Workflow</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 p-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Save Workflow</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
