import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BellIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

// Mock user data - this would come from auth context
const user = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: null,
}

const userNavigation = [
  { name: 'Your Profile', href: '/profile', icon: UserIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Sign out', href: '#', icon: ArrowRightOnRectangleIcon },
]

// Breadcrumb configuration
const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/agents': 'Agents',
  '/agents/create': 'Create Agent',
  '/knowledge': 'Knowledge Base',
  '/knowledge/upload': 'Upload Documents',
  '/workflows': 'Workflows',
  '/settings': 'Settings',
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()

  const getBreadcrumbs = () => {
    const path = location.pathname
    
    // Handle dynamic routes like /agents/:id/edit
    if (path.includes('/agents/') && path.includes('/edit')) {
      return 'Edit Agent'
    }
    
    return breadcrumbMap[path] || 'Dashboard'
  }

  const handleSignOut = () => {
    // TODO: Implement logout logic
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-secondary-900">
              {getBreadcrumbs()}
            </h1>
          </div>

          {/* Right side - notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="p-2 text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 rounded-full transition-colors"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="relative ml-3">
              <Menu>
                <div>
                  <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-secondary-300 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-secondary-600" />
                      </div>
                      <span className="text-sm font-medium text-secondary-700">
                        {user.name}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 text-secondary-400" />
                    </div>
                  </Menu.Button>
                </div>
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
                    {userNavigation.map((item) => (
                      <Menu.Item key={item.name}>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={() => item.name === 'Sign out' ? handleSignOut() : navigate(item.href)}
                            className={`${
                              active ? 'bg-secondary-100' : ''
                            } flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 transition-colors`}
                          >
                            <item.icon className="mr-3 h-4 w-4" />
                            {item.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
