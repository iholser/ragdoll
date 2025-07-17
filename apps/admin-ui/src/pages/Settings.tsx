import { useState } from 'react'
import { 
  Cog6ToothIcon, 
  BellIcon, 
  ShieldCheckIcon,
  GlobeAltIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

interface SettingsSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Basic application settings and preferences',
    icon: Cog6ToothIcon,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure email and system notifications',
    icon: BellIcon,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Authentication and security settings',
    icon: ShieldCheckIcon,
  },
  {
    id: 'api',
    title: 'API Settings',
    description: 'API keys and external integrations',
    icon: GlobeAltIcon,
  },
  {
    id: 'users',
    title: 'User Management',
    description: 'Manage team members and permissions',
    icon: UserIcon,
  },
  {
    id: 'organization',
    title: 'Organization',
    description: 'Organization details and billing',
    icon: BuildingOfficeIcon,
  },
]

export function Settings() {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      organizationName: 'Demo Organization',
      timezone: 'America/New_York',
      language: 'en',
      theme: 'light',
    },
    notifications: {
      emailNotifications: true,
      systemNotifications: true,
      agentAlerts: true,
      errorAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'strong',
    },
    api: {
      openaiApiKey: '',
      ollamaEndpoint: 'http://localhost:11434',
      webhookUrl: '',
    },
  })

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }))
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Organization Name
        </label>
        <input
          type="text"
          value={settings.general.organizationName}
          onChange={(e) => updateSetting('general', 'organizationName', e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Timezone
        </label>
        <select
          value={settings.general.timezone}
          onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Language
        </label>
        <select
          value={settings.general.language}
          onChange={(e) => updateSetting('general', 'language', e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ja">Japanese</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Theme
        </label>
        <select
          value={settings.general.theme}
          onChange={(e) => updateSetting('general', 'theme', e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-secondary-700">Email Notifications</label>
          <p className="text-xs text-secondary-600">Receive important updates via email</p>
        </div>
        <input
          type="checkbox"
          checked={settings.notifications.emailNotifications}
          onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-secondary-700">System Notifications</label>
          <p className="text-xs text-secondary-600">Show notifications in the dashboard</p>
        </div>
        <input
          type="checkbox"
          checked={settings.notifications.systemNotifications}
          onChange={(e) => updateSetting('notifications', 'systemNotifications', e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-secondary-700">Agent Alerts</label>
          <p className="text-xs text-secondary-600">Notify when agents go offline or encounter errors</p>
        </div>
        <input
          type="checkbox"
          checked={settings.notifications.agentAlerts}
          onChange={(e) => updateSetting('notifications', 'agentAlerts', e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-secondary-700">Error Alerts</label>
          <p className="text-xs text-secondary-600">Notify when system errors occur</p>
        </div>
        <input
          type="checkbox"
          checked={settings.notifications.errorAlerts}
          onChange={(e) => updateSetting('notifications', 'errorAlerts', e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
        />
      </div>
    </div>
  )

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          OpenAI API Key
        </label>
        <input
          type="password"
          value={settings.api.openaiApiKey}
          onChange={(e) => updateSetting('api', 'openaiApiKey', e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-secondary-600 mt-1">
          Required for GPT-based agents
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Ollama Endpoint
        </label>
        <input
          type="url"
          value={settings.api.ollamaEndpoint}
          onChange={(e) => updateSetting('api', 'ollamaEndpoint', e.target.value)}
          placeholder="http://localhost:11434"
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-secondary-600 mt-1">
          Endpoint for local Ollama instance
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Webhook URL
        </label>
        <input
          type="url"
          value={settings.api.webhookUrl}
          onChange={(e) => updateSetting('api', 'webhookUrl', e.target.value)}
          placeholder="https://your-webhook-url.com"
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-secondary-600 mt-1">
          URL for webhook notifications
        </p>
      </div>
    </div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'api':
        return renderApiSettings()
      default:
        return (
          <div className="text-center py-8">
            <p className="text-secondary-600">Settings for {activeSection} coming soon...</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-secondary-200 pb-4">
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-600 mt-1">
          Configure your application settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-700 hover:bg-secondary-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <div className="border-b border-secondary-200 pb-4 mb-6">
              <h2 className="text-lg font-medium text-secondary-900">
                {settingsSections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-secondary-600 mt-1">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>

            {renderActiveSection()}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
