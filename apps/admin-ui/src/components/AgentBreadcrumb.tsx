import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  label: string
  path: string
}

interface AgentBreadcrumbProps {
  agentId?: string
  agentName?: string
  items: BreadcrumbItem[]
}

export function AgentBreadcrumb({ agentId, agentName, items }: AgentBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-4">
      <Link 
        to="/agents" 
        className="hover:text-secondary-900 transition-colors"
      >
        Agents
      </Link>
      
      {agentId && (
        <>
          <ChevronRightIcon className="h-4 w-4" />
          <Link 
            to={`/agents/${agentId}`} 
            className="hover:text-secondary-900 transition-colors"
          >
            {agentName || 'Agent'}
          </Link>
        </>
      )}
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRightIcon className="h-4 w-4" />
          <Link 
            to={item.path}
            className="hover:text-secondary-900 transition-colors"
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  )
}
