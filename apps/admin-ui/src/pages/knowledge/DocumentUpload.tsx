import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

export function DocumentUpload() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { agentId } = useParams<{ agentId: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('')

  // Fetch agent details for context
  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentId ? apiClient.getAgent(agentId) : Promise.resolve(null),
    enabled: !!agentId,
  })

  // Fetch knowledge bases for the agent
  const { data: knowledgeBases } = useQuery({
    queryKey: ['agent-knowledge-bases', agentId],
    queryFn: () => agentId ? apiClient.getAgentKnowledgeBases(agentId) : Promise.resolve(null),
    enabled: !!agentId,
  })

  // Auto-select first knowledge base if available
  useEffect(() => {
    if (knowledgeBases?.data && knowledgeBases.data.length > 0 && !selectedKnowledgeBase) {
      setSelectedKnowledgeBase(knowledgeBases.data[0].id)
    }
  }, [knowledgeBases, selectedKnowledgeBase])

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedKnowledgeBase) {
        throw new Error('Please select a knowledge base')
      }
      
      if (agentId) {
        return apiClient.uploadAgentDocument(agentId, file, selectedKnowledgeBase)
      } else {
        return apiClient.uploadDocument(file, selectedKnowledgeBase)
      }
    },
    onSuccess: () => {
      const queryKey = agentId ? ['agent-documents', agentId] : ['documents']
      queryClient.invalidateQueries({ queryKey })
      toast.success('Document uploaded successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload document')
    },
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      for (const file of selectedFiles) {
        await uploadMutation.mutateAsync(file)
      }
      setSelectedFiles([])
      // Navigate back to the appropriate knowledge base page
      const backPath = agentId ? `/agents/${agentId}/knowledge` : '/knowledge'
      setTimeout(() => navigate(backPath), 1000)
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-secondary-200 pb-4">
        <div className="flex items-center space-x-4">
          <Link
            to={agentId ? `/agents/${agentId}/knowledge` : '/knowledge'}
            className="inline-flex items-center text-secondary-600 hover:text-secondary-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Knowledge Base
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mt-2">Upload Documents</h1>
        <p className="text-secondary-600 mt-1">
          {agentId && agent?.data 
            ? `Add documents to ${agent.data.name}'s knowledge base`
            : 'Add new documents to your knowledge base'
          }
        </p>
      </div>

      {/* Knowledge Base Selection */}
      {knowledgeBases?.data && knowledgeBases.data.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            Select Knowledge Base
          </h3>
          <select
            value={selectedKnowledgeBase}
            onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a knowledge base...</option>
            {knowledgeBases.data.map((kb: any) => (
              <option key={kb.id} value={kb.id}>
                {kb.name} ({kb.document_count || 0} documents)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-secondary-300 hover:border-secondary-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Upload your documents
          </h3>
          <p className="text-secondary-600 mb-4">
            Drag and drop your files here, or click to browse
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-secondary-500 mt-2">
            Supported formats: PDF, DOC, DOCX, TXT, MD
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{file.name}</p>
                    <p className="text-xs text-secondary-600">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Upload Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Documents will be automatically processed and indexed</li>
          <li>• Text will be extracted and chunked for optimal retrieval</li>
          <li>• Larger documents may take longer to process</li>
          <li>• Ensure your documents contain relevant information for your agents</li>
        </ul>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end space-x-4">
        <Link
          to={agentId ? `/agents/${agentId}/knowledge` : '/knowledge'}
          className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50"
        >
          Cancel
        </Link>
        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading || !selectedKnowledgeBase}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
