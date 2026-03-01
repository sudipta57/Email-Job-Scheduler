'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  ChevronDown,
  Clock,
  Italic,
  List,
  ListOrdered,
  Paperclip,
  Redo2,
  Type,
  Underline,
  Undo2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { scheduleBulk } from '@/lib/api'

export default function ComposePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [toEmails, setToEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [delayBetweenMs, setDelayBetweenMs] = useState(2000)
  const [hourlyLimit, setHourlyLimit] = useState(200)
  const [scheduledAt, setScheduledAt] = useState('')
  const [showSendLater, setShowSendLater] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmedSchedule, setConfirmedSchedule] = useState('')

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase()
    if (trimmed && !toEmails.includes(trimmed)) {
      setToEmails((prev) => [...prev, trimmed])
    }
  }

  const removeEmail = (email: string) => {
    setToEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail(emailInput)
      setEmailInput('')
    }
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split(/[\r\n,]+/)
      const validEmails = lines
        .map((l) => l.trim().toLowerCase())
        .filter((l) => l && l.includes('@'))
      setToEmails((prev) => {
        const unique = validEmails.filter((e) => !prev.includes(e))
        return [...prev, ...unique]
      })
      toast.success(`Imported ${validEmails.length} emails from file`)
    }
    reader.readAsText(file)
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }

  const setQuickOption = (option: string) => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let date: Date
    switch (option) {
      case 'Tomorrow':
        tomorrow.setHours(9, 0, 0, 0)
        date = tomorrow
        break
      case 'Tomorrow, 10:00 AM':
        tomorrow.setHours(10, 0, 0, 0)
        date = tomorrow
        break
      case 'Tomorrow, 11:00 AM':
        tomorrow.setHours(11, 0, 0, 0)
        date = tomorrow
        break
      case 'Tomorrow, 3:00 PM':
        tomorrow.setHours(15, 0, 0, 0)
        date = tomorrow
        break
      default:
        date = tomorrow
    }

    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const pad = (n: number) => n.toString().padStart(2, '0')
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    setScheduledAt(formatted)
  }

  const handleDone = () => {
    if (scheduledAt) {
      setConfirmedSchedule(scheduledAt)
    }
    setShowSendLater(false)
  }

  const handleSubmit = async () => {
    if (toEmails.length === 0) {
      toast.error('Please add at least one recipient')
      return
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!confirmedSchedule) {
      toast.error('Please set a schedule time using Send Later')
      return
    }

    setLoading(true)
    try {
      await scheduleBulk({
        emails: toEmails.map((e) => ({ to: e })),
        subject,
        body,
        sender: user.email,
        startAt: new Date(confirmedSchedule).toISOString(),
        delayBetweenMs,
        hourlyLimit,
      })
      toast.success('Emails scheduled successfully!')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to schedule emails')
    } finally {
      setLoading(false)
    }
  }

  const quickOptions = [
    'Tomorrow',
    'Tomorrow, 10:00 AM',
    'Tomorrow, 11:00 AM',
    'Tomorrow, 3:00 PM',
  ]

  const formatDisplay = (isoLocal: string) => {
    const d = new Date(isoLocal)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Compose New Email</h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip size={18} className="text-gray-500" />
          </button>

          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setShowSendLater((prev) => !prev)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Clock size={18} className="text-gray-500" />
            </button>
            {confirmedSchedule && (
              <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                {formatDisplay(confirmedSchedule)}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              if (confirmedSchedule) {
                void handleSubmit()
              } else {
                setShowSendLater((prev) => !prev)
              }
            }}
            disabled={loading}
            className="border border-green-600 text-green-600 rounded-full px-4 py-1.5 hover:bg-green-50 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Later'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto mt-8 px-8">
        {/* From */}
        <div className="flex items-center border-b border-gray-200 py-3">
          <span className="text-gray-500 mr-8 text-sm">From</span>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
            <span className="text-sm text-gray-700">{user.email}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>

        {/* To */}
        <div className="flex items-center border-b border-gray-200 py-3 gap-2 flex-wrap">
          <span className="text-gray-500 mr-8 text-sm">To</span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {toEmails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 border border-green-500 text-green-700 rounded-full px-3 py-0.5 text-sm"
              >
                {email}
                <button
                  onClick={() => removeEmail(email)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder={toEmails.length === 0 ? 'Enter email addresses' : ''}
              className="flex-1 min-w-[150px] outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-green-600 text-sm font-medium hover:text-green-700 whitespace-nowrap transition-colors"
          >
            ↑ Upload List
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleCsvUpload}
            className="hidden"
          />
        </div>

        {/* Subject */}
        <div className="flex items-center border-b border-gray-200 py-3">
          <span className="text-gray-500 mr-8 text-sm">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
            className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Delay row */}
        <div className="flex items-center border-b border-gray-200 py-3 gap-4">
          <span className="text-gray-500 text-sm">Delay between 2 emails</span>
          <input
            type="number"
            value={delayBetweenMs}
            onChange={(e) => setDelayBetweenMs(Number(e.target.value))}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm outline-none"
          />
          <span className="text-gray-500 text-sm">Hourly Limit</span>
          <input
            type="number"
            value={hourlyLimit}
            onChange={(e) => setHourlyLimit(Number(e.target.value))}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm outline-none"
          />
        </div>

        {/* Body */}
        <div className="mt-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type Your Reply..."
            className="w-full min-h-[200px] bg-gray-50 p-4 rounded-t-lg outline-none text-sm text-gray-700 placeholder-gray-400 resize-y"
          />

          {/* Toolbar */}
          <div className="flex items-center gap-3 border border-gray-200 rounded-b-lg px-4 py-2">
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <Undo2 size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <Redo2 size={16} />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <Type size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <Bold size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <Italic size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <Underline size={16} />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <AlignLeft size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <AlignCenter size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <AlignRight size={16} />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <List size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
              <ListOrdered size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Send Later Panel */}
      {showSendLater && (
        <div className="absolute right-0 top-16 w-72 bg-white shadow-lg rounded-xl p-6 border border-gray-100 z-50">
          <h3 className="font-bold text-gray-900 mb-4">Send Later</h3>

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none mb-4"
          />

          <div className="flex flex-col gap-2 mb-6">
            {quickOptions.map((option) => (
              <button
                key={option}
                onClick={() => setQuickOption(option)}
                className="text-left text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSendLater(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="border border-green-600 text-green-600 rounded-full px-4 py-1 text-sm font-medium hover:bg-green-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
