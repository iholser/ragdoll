import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  PlusIcon, 
  CpuChipIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { apiClient } from '@/lib/api'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

export function AgentsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: agents, isLoading, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
  })

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const response = await apiClient.deleteAgent(agentId)
      if (response.success) {
        toast.success('Agent deleted successfully')
        refetch()
      } else {
        toast.error(response.error || 'Failed to delete agent')
      }
    } catch (error) {
      toast.error('Failed to delete agent')
    }
  }

  const filteredAgents = agents?.data?.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && agent.isActive) ||
                         (filterStatus === 'inactive' && !agent.isActive)
    
    return matchesSearch && matchesStatus
  }) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-secondary-200 pb-4">
          <div className="h-8 bg-secondary-200 rounded animate-pulse w-48"></div>
          <div className="h-4 bg-secondary-200 rounded animate-pulse w-96 mt-2"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
              <div className="animate-pulse">
                <div className="h-6 bg-secondary-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-secondary-200 rounded w-96"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-secondary-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Agents</h1>
            <p className="text-secondary-600 mt-1">
              Manage your AI agents and their configurations
            </p>
          </div>
          <Link
            to="/agents/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Agent
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-secondary-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        {filteredAgents.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-secondary-200 text-center">
            <CpuChipIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No agents found</h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'No agents match your current filters.' 
                : 'Get started by creating your first agent.'
              }
            </p>
            {(!searchTerm && filterStatus === 'all') && (
              <Link
                to="/agents/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Link>
            )}
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <div key={agent.id} className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CpuChipIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-secondary-900">{agent.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-secondary-600 mt-1">{agent.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-secondary-500">
                      <span>Created: {formatDateTime(agent.createdAt)}</span>
                      <span>Updated: {formatDateTime(agent.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/agents/${agent.id}`}
                    className="inline-flex items-center px-3 py-1 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
                  >
                    View
                  </Link>
                  <Link
                    to={`/agents/${agent.id}/edit`}
                    className="inline-flex items-center px-3 py-1 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  
                  <div className="relative">
                    <Menu>
                      <Menu.Button className="inline-flex items-center px-2 py-1 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }: { active: boolean }) => (
                              <button
                                onClick={() => handleDeleteAgent(agent.id)}
                                className={`${
                                  active ? 'bg-red-50' : ''
                                } flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50`}
                              >
                                <TrashIcon className="mr-3 h-4 w-4" />
                                Delete Agent
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
