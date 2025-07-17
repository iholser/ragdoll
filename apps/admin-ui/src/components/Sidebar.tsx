import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  CpuChipIcon,
  BookOpenIcon,
  Cog8ToothIcon,
  PlayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Agents', href: '/agents', icon: CpuChipIcon },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpenIcon },
  { name: 'Workflows', href: '/workflows', icon: PlayIcon },
  { name: 'Settings', href: '/settings', icon: Cog8ToothIcon },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-white shadow-sm border-r border-secondary-200">
      {/* Logo */}
      <div className="p-6 border-b border-secondary-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <UserGroupIcon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-secondary-900">RAGdoll</h1>
            <p className="text-sm text-secondary-500">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-700 hover:text-secondary-900 hover:bg-secondary-100'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
