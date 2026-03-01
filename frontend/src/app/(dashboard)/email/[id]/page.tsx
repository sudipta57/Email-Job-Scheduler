'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Star, Archive, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { getEmailById } from '@/lib/api'
import type { Email } from '@/types'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto mt-8 px-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-28 bg-gray-200 rounded" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 rounded" />
        <div className="h-3 w-4/6 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

function ErrorState() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
      <p className="text-gray-500 text-lg">Email not found</p>
      <button
        onClick={() => router.back()}
        className="text-sm text-green-600 hover:underline"
      >
        Go back
      </button>
    </div>
  )
}

export default function EmailDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [email, setEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user || !id) return

    const fetchEmail = async () => {
      setLoading(true)
      setError(false)
      try {
        const data = await getEmailById(id)
        setEmail(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    void fetchEmail()
  }, [id, user])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  if (error) return <ErrorState />

  const senderInitial = email?.sender?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-white">
      {/* Top header */}
      <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-4 truncate">
            {loading ? (
              <span className="inline-block h-5 w-64 bg-gray-200 rounded animate-pulse" />
            ) : (
              email?.subject
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <Star size={18} />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <Archive size={18} />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <Trash2 size={18} />
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <Image
            src={user.avatar}
            alt={user.displayName}
            width={32}
            height={32}
            className="rounded-full w-8 h-8"
          />
        </div>
      </header>

      {/* Email body area */}
      {loading ? (
        <LoadingSkeleton />
      ) : email ? (
        <div className="max-w-3xl mx-auto mt-8 px-8">
          {/* Sender row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {senderInitial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{email.sender}</span>
                  <span className="text-sm text-gray-500">
                    &lt;{email.sender}&gt;
                  </span>
                </div>
                <p className="text-xs text-gray-400">to me ▼</p>
              </div>
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {formatDate(email.sentAt ?? email.scheduledAt)}
            </span>
          </div>

          {/* Body text */}
          <div className="mt-6 text-gray-800 leading-relaxed whitespace-pre-wrap">
            {email.body}
          </div>
        </div>
      ) : null}
    </div>
  )
}
