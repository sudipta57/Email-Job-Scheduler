export interface User {
  id: string
  displayName: string
  email: string
  avatar: string
}

export interface Email {
  id: string
  to: string
  subject: string
  body: string
  sender: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  scheduledAt: string
  sentAt: string | null
  jobId: string | null
  createdAt: string
}

export interface BulkSchedulePayload {
  emails: Array<{ to: string }>
  subject: string
  body: string
  sender: string
  startAt: string
  delayBetweenMs: number
  hourlyLimit: number
}
