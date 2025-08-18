'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  MessageSquare,
  Settings,
  Building2,
  User,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

const navigation = [
  {
    id: 'dashboard',
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: Home,
  },
  {
    id: 'employees',
    name: 'Employés',
    href: '/employees',
    icon: Users,
  },
  {
    id: 'chat',
    name: 'Messages',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    id: 'settings',
    name: 'Paramètres',
    href: '/settings',
    icon: Settings,
  },
]

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const isActiveRoute = (href) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        sidebar-layout bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col
        ${isMobileOpen ? 'mobile-open' : ''}
        z-50
      `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TeamFlow</h1>
              <p className="text-slate-400 text-sm">Gestion d'équipe IA</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl 
                  transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105'
                  }
                `}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-6 border-t border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || 'Utilisateur'}
              </p>
              <p className="text-xs text-slate-400">
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : 'En ligne'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
