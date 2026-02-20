import { NextApiRequest, NextApiResponse } from 'next'
import admin from '../../../lib/firebaseAdmin'
import { getFirestore } from 'firebase-admin/firestore'
import { DecodedIdToken } from 'firebase-admin/auth'

const db = getFirestore()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.auth_token

    if (!token) {
      return res.status(401).json({ authenticated: false, message: 'No token found' })
    }

    let decodedToken: DecodedIdToken
    let uid: string

    // Try to verify as ID token first
    try {
      decodedToken = await admin.auth().verifyIdToken(token)
      uid = decodedToken.uid
    } catch {
      // If it fails, it might be a custom token
      // Custom tokens cannot be verified directly, so we return error
      return res.status(401).json({ authenticated: false, message: 'Invalid token' })
    }

    // Get user record to check custom claims
    const userRecord = await admin.auth().getUser(uid)
    const role = decodedToken.role || userRecord.customClaims?.role || 'user'

    // Ensure user document exists in Firestore
    const userDoc = await db.collection('Users').doc(uid).get()
    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await db.collection('Users').doc(uid).set({
        uid,
        email: decodedToken.email,
        role,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      })
    } else {
      // Update role if it changed
      await db.collection('Users').doc(uid).update({
        role,
        updatedAt: admin.firestore.Timestamp.now()
      })
    }

    return res.status(200).json({
      authenticated: true,
      uid,
      role,
      email: decodedToken.email
    })
  } catch (error: unknown) {
    console.error('Auth status error:', error instanceof Error ? error.message : error)
    return res.status(401).json({ authenticated: false, message: 'Invalid token' })
  }
}
