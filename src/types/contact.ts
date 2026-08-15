import { Timestamp } from 'firebase/firestore'

/**
 * A message submitted through the public homepage contact form.
 * Stored in the `ContactMessages` collection - see firestore.rules for the
 * matching security rules (public create, admin-only read).
 */
export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read'
  createdAt: Timestamp
}

/**
 * Shape submitted by the contact form, before server-assigned fields
 * (id, status, createdAt) are attached.
 */
export interface NewContactMessageInput {
  name: string
  email: string
  message: string
}
