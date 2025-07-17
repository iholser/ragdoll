import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { 
  PlusIcon, 
  DocumentIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  ArrowLeftIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { apiClient } from '@/lib/api'
import { formatDateTime } from '@/utils'
import { AgentBreadcrumb } from '@/components/AgentBreadcrumb'
import toast from 'react-hot-toast'

interface Document {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  createdAt: string
  updatedAt: string
}

// Mock data - this would come from API
const mockDocuments: Document[] = [
  {
    id: '1',
    filename: 'faq.pdf',
    originalName: 'FAQ.pdf',
    size: 1024000,
    mimeType: 'application/pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    filename: 'user-guide.pdf',
    originalName: 'User Guide.pdf',
    size: 2048000,
    mimeType: 'application/pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function KnowledgeBase() {
  const { agentId } = useParams<{ agentId: string }>()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => apiClient.getAgent(agentId!),
    enabled: !!agentId,
  })

  // Fetch documents using the new agent-specific API
  const { data: documentsResponse, isLoading } = useQuery({
    queryKey: agentId ? ['agent-documents', agentId] : ['documents'],
    queryFn: () => {
      if (agentId) {
        return apiClient.getAgentDocuments(agentId)
      } else {
        return apiClient.getDocuments()
      }
    },
  })

  const documents = documentsResponse?.data || mockDocuments

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = agentId 
        ? await apiClient.deleteAgentDocument(agentId, documentId)
        : await apiClient.deleteDocument(documentId)
      
      if (response.success) {
        toast.success('Document deleted successfully')
        // Refetch documents
      } else {
        toast.error(response.error || 'Failed to delete document')
      }
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }

  const filteredDocuments = documents.filter((doc: Document) =>
    doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getUploadUrl = () => {
    return agentId ? `/agents/${agentId}/knowledge/upload` : '/knowledge/upload'
  }

  const getBackUrl = () => {
    return agentId ? `/agents/${agentId}` : null
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('text')) return '📝'
    return '📁'
  }

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
      {/* Breadcrumb */}
      {agentId && (
        <AgentBreadcrumb
          agentId={agentId}
          agentName={agent?.data?.name}
          items={[
            { label: 'Knowledge Base', path: agentId ? `/agents/${agentId}/knowledge` : '/knowledge' }
          ]}
        />
      )}

      {/* Header */}
      <div className="border-b border-secondary-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            {getBackUrl() && (
              <Link
                to={getBackUrl()!}
                className="inline-flex items-center text-secondary-600 hover:text-secondary-900 mb-2"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Agent
              </Link>
            )}
            <div className="flex items-center space-x-3">
              {agentId && agent?.data && (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CpuChipIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-secondary-700">
                    {agent.data.name}
                  </span>
                  <span className="text-secondary-400">•</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  {agentId ? 'Agent Knowledge Base' : 'Knowledge Base'}
                </h1>
                <p className="text-secondary-600 mt-1">
                  {agentId 
                    ? `Manage documents and knowledge sources for ${agent?.data?.name || 'this agent'}`
                    : 'Manage your documents and knowledge sources'
                  }
                </p>
              </div>
            </div>
          </div>
          <Link
            to={getUploadUrl()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload Documents
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-secondary-200 text-center">
            <DocumentIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm ? 'No documents found' : 'No documents uploaded'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm
                ? 'No documents match your search criteria.'
                : 'Upload your first document to get started with your knowledge base.'
              }
            </p>
            {!searchTerm && (
              <Link
                to="/knowledge/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document: Document) => (
              <div key={document.id} className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getFileIcon(document.mimeType)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-secondary-900 truncate">
                        {document.originalName}
                      </h3>
                      <p className="text-xs text-secondary-600 mt-1">
                        {formatFileSize(document.size)}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {formatDateTime(document.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <Menu as={Fragment}>
                    <div className="relative">
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
                                onClick={() => handleDeleteDocument(document.id)}
                                className={`${
                                  active ? 'bg-red-50' : ''
                                } flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50`}
                              >
                                <TrashIcon className="mr-3 h-4 w-4" />
                                Delete Document
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </div>
                  </Menu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
