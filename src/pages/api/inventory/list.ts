import type { NextApiRequest, NextApiResponse } from 'next'
import admin from '../../../lib/firebaseAdmin'
import { getFirestore } from 'firebase-admin/firestore'
import { InventoryItem, ApiListResponse } from '@/types/inventory'

const db = getFirestore()

interface ApiResponse extends ApiListResponse<InventoryItem> {
  success: boolean
  data: InventoryItem[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const token = req.cookies.auth_token

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify token
    let decodedToken
    try {
      decodedToken = await admin.auth().verifyIdToken(token)
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Verify user has access (authenticated user)
    if (!decodedToken.uid) {
      return res.status(401).json({ error: 'Invalid user' })
    }

    // Fetch inventory from Firestore
    const snapshot = await db.collection('Inventory').get()
    const items: InventoryItem[] = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Ensure Timestamps are properly serialized
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        purchaseDate: data.purchaseDate || null,
        expirationDate: data.expirationDate || null,
        location: data.location || null
      } as InventoryItem
    })

    // Sort by name
    items.sort((a: InventoryItem, b: InventoryItem) => 
      (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
    )

    return res.status(200).json({ 
      success: true, 
      data: items,
      total: items.length 
    })
  } catch (error: unknown) {
    console.error('Inventory fetch error:', error instanceof Error ? error.message : error)
    return res.status(500).json({ error: 'Failed to fetch inventory' })
  }
}
