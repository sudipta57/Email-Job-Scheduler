'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Clock, LogOut, Send } from 'lucide-react'
import { logout } from '@/lib/api'
import type { User } from '@/types'

type Tab = 'scheduled' | 'sent'

interface SidebarProps {
  user: User
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  scheduledCount: number
  sentCount: number
}

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  scheduledCount,
  sentCount,
}: SidebarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // ignore
    }
    router.push('/login')
  }

  const navItems: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'scheduled',
      label: 'Scheduled',
      icon: <Clock size={16} />,
      count: scheduledCount,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: <Send size={16} />,
      count: sentCount,
    },
  ]

  return (
    <aside className="flex flex-col w-[260px] min-w-[260px] h-screen bg-white border-r border-gray-200 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-xl font-bold text-black">ONB</span>
      </div>

      {/* User card */}
      <div className="relative mx-2 mt-2" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="w-full rounded-xl bg-gray-50 p-3 flex items-center gap-3 hover:bg-gray-100 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-gray-900 truncate text-sm">{user.displayName}</p>
            <p className="text-gray-500 text-sm truncate">{user.email}</p>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 right-0 mt-1 mx-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Compose button */}
      <div className="mx-2 mt-3">
        <button
          onClick={() => router.push('/compose')}
          className="w-full border border-green-600 text-green-600 hover:bg-green-50 rounded-full py-2 font-medium text-sm transition-colors"
        >
          Compose
        </button>
      </div>

      {/* CORE label */}
      <p className="px-4 mt-6 mb-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
        Core
      </p>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mx-2 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span className={isActive ? 'text-green-600' : 'text-gray-400'}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              <span
                className={`text-xs font-semibold ${isActive ? 'text-green-600' : 'text-gray-400'}`}
              >
                {item.count}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
