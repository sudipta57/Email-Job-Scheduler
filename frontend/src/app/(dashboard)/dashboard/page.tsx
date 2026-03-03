'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, Filter, Inbox, RefreshCw, Search, Star } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getMe, getScheduledEmails, getSentEmails } from '@/lib/api'
import type { Email } from '@/types'
import Sidebar from '@/components/layout/Sidebar'

type Tab = 'scheduled' | 'sent'

function formatScheduledAt(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function ScheduledBadge({ dateStr }: { dateStr: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 whitespace-nowrap">
      <Clock size={11} />
      {formatScheduledAt(dateStr)}
    </span>
  )
}

function SentBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
      Sent
    </span>
  )
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 animate-pulse">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
          <div className="flex-1 h-3 bg-gray-200 rounded" />
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </div>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400 py-24">
      <Inbox size={48} strokeWidth={1.5} />
      <p className="text-sm">No emails yet</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading, setUser, setToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<Tab>('scheduled')
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([])
  const [sentEmails, setSentEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Handle token from URL (OAuth redirect)
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('auth_token', token)
      setToken(token)
      router.replace('/dashboard')
      void getMe().then(setUser)
    }
  }, [searchParams, router, setUser, setToken])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const fetchCurrentTab = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      if (activeTab === 'scheduled') {
        const data = await getScheduledEmails()
        setScheduledEmails(data)
      } else {
        const data = await getSentEmails()
        setSentEmails(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [activeTab, user])

  useEffect(() => {
    void fetchCurrentTab()
  }, [fetchCurrentTab])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      void fetchCurrentTab()
    }, 10_000)
    return () => clearInterval(interval)
  }, [fetchCurrentTab, user])

  const handleRefresh = () => {
    void fetchCurrentTab()
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const activeEmails = activeTab === 'scheduled' ? scheduledEmails : sentEmails
  const filteredEmails = search.trim()
    ? activeEmails.filter(
        (e) =>
          e.to.toLowerCase().includes(search.toLowerCase()) ||
          e.subject.toLowerCase().includes(search.toLowerCase()) ||
          e.body.toLowerCase().includes(search.toLowerCase())
      )
    : activeEmails

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search emails…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
            <button
              onClick={() => {}}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Filter"
            >
              <Filter size={15} />
            </button>
            <button
              onClick={handleRefresh}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {loading ? (
            <SkeletonRows />
          ) : filteredEmails.length === 0 ? (
            <EmptyState />
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => router.push('/email/' + email.id)}
                className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* To */}
                <span className="text-sm text-gray-400 whitespace-nowrap w-36 truncate">
                  To: {email.to}
                </span>

                {/* Badge */}
                <div className="flex-shrink-0">
                  {activeTab === 'scheduled' ? (
                    <ScheduledBadge dateStr={email.scheduledAt} />
                  ) : (
                    <SentBadge />
                  )}
                </div>

                {/* Subject + preview */}
                <div className="flex-1 min-w-0 text-sm truncate">
                  <span className="font-semibold text-gray-900">{email.subject}</span>
                  <span className="text-gray-400"> - </span>
                  <span className="text-gray-400">{email.body}</span>
                </div>

                {/* Star */}
                <Star size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </main>

    </div>
  )
}
