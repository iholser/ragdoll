import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { AgentProfile } from '@ragdoll/shared-types'
import toast from 'react-hot-toast'

const editAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  welcomeMessage: z.string().min(1, 'Welcome message is required'),
  fallbackMessage: z.string().min(1, 'Fallback message is required'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  isActive: z.boolean(),
})

type EditAgentFormData = z.infer<typeof editAgentSchema>

export function AgentEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<EditAgentFormData>({
    resolver: zodResolver(editAgentSchema),
  })

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => apiClient.getAgent(id!),
    enabled: !!id,
  })

  const updateAgentMutation = useMutation({
    mutationFn: (data: Partial<AgentProfile>) => apiClient.updateAgent(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
      toast.success('Agent updated successfully!')
      navigate('/agents')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update agent')
    },
  })

  useEffect(() => {
    if (agent?.data) {
      reset({
        name: agent.data.name,
        description: agent.data.description || '',
        welcomeMessage: agent.data.welcomeMessage,
        fallbackMessage: agent.data.fallbackMessage,
        systemPrompt: agent.data.systemPrompt,
        isActive: agent.data.isActive,
      })
    }
  }, [agent, reset])

  const onSubmit = async (data: EditAgentFormData) => {
    setIsSubmitting(true)
    try {
      await updateAgentMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-secondary-200 pb-4">
          <div className="h-8 bg-secondary-200 rounded animate-pulse w-48"></div>
          <div className="h-4 bg-secondary-200 rounded animate-pulse w-96 mt-2"></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-secondary-200 rounded w-24"></div>
            <div className="h-10 bg-secondary-200 rounded"></div>
            <div className="h-4 bg-secondary-200 rounded w-32"></div>
            <div className="h-20 bg-secondary-200 rounded"></div>
          </div>
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
        <h1 className="text-2xl font-bold text-secondary-900 mt-2">Edit Agent</h1>
        <p className="text-secondary-600 mt-1">
          Update your agent's configuration and behavior
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h2 className="text-lg font-medium text-secondary-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                Agent Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Customer Support Agent"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description of what this agent does..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register('isActive')}
                id="isActive"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-secondary-900">
                Active (agent will be available for use)
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h2 className="text-lg font-medium text-secondary-900 mb-4">Agent Behavior</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-secondary-700">
                System Prompt <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('systemPrompt')}
                id="systemPrompt"
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Define how the agent should behave and respond to users..."
              />
              <p className="mt-1 text-sm text-secondary-500">
                This prompt defines the agent's personality, tone, and behavior guidelines.
              </p>
              {errors.systemPrompt && (
                <p className="mt-1 text-sm text-red-600">{errors.systemPrompt.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="welcomeMessage" className="block text-sm font-medium text-secondary-700">
                Welcome Message <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('welcomeMessage')}
                id="welcomeMessage"
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="First message users will see when starting a conversation..."
              />
              <p className="mt-1 text-sm text-secondary-500">
                This message greets users when they first interact with the agent.
              </p>
              {errors.welcomeMessage && (
                <p className="mt-1 text-sm text-red-600">{errors.welcomeMessage.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="fallbackMessage" className="block text-sm font-medium text-secondary-700">
                Fallback Message <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('fallbackMessage')}
                id="fallbackMessage"
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Message shown when the agent can't understand or help..."
              />
              <p className="mt-1 text-sm text-secondary-500">
                This message is shown when the agent cannot understand or help with a user's request.
              </p>
              {errors.fallbackMessage && (
                <p className="mt-1 text-sm text-red-600">{errors.fallbackMessage.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h2 className="text-lg font-medium text-secondary-900 mb-4">Preview</h2>
          <div className="bg-secondary-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {watch('name')?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-secondary-900">
                  {watch('welcomeMessage') || 'Welcome message will appear here...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/agents"
            className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Agent'}
          </button>
        </div>
      </form>
    </div>
  )
}
