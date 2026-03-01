import axios from 'axios'
import type { BulkSchedulePayload, Email, User } from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true,
})

export const getScheduledEmails = async (): Promise<Email[]> => {
  const response = await api.get<Email[]>('/api/emails/scheduled')
  return response.data
}

export const getSentEmails = async (): Promise<Email[]> => {
  const response = await api.get<Email[]>('/api/emails/sent')
  return response.data
}

export const scheduleEmail = (payload: {
  to: string
  subject: string
  body: string
  sender: string
  scheduledAt: string
}) => api.post('/emails/schedule', payload)

export const scheduleBulk = (payload: BulkSchedulePayload) =>
  api
    .post<{ scheduled: number }>('/api/emails/schedule-bulk', payload)
    .then((response) => response.data)

export const getEmailById = async (id: string): Promise<Email> => {
  const response = await api.get<Email>(`/api/emails/${id}`)
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me')
  return response.data
}

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout')
}

export default api
