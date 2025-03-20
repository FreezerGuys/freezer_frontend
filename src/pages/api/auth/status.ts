// pages/api/auth/status.ts

import { getAuth } from 'firebase/auth'
import { app } from '../../../lib/firebase'  // Import your Firebase app initialization
import { NextApiRequest, NextApiResponse } from 'next'
import { doc, getDoc, getFirestore } from 'firebase/firestore'

const auth = getAuth(app)
const db = getFirestore(app)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = auth.currentUser

    if (!user) {
      return res.status(401).json({ authenticated: false })
    }

    // Optionally, you can fetch additional user information, such as their role from Firestore
    // For example, let's assume you're storing user roles in Firestore
    const roleSnapshot = await getDoc(doc(db, 'users', user.email!.normalize()))  // Replace db with your Firestore instance
    const roleData = roleSnapshot.exists() ? roleSnapshot.data() : null

    return res.status(200).json({
      authenticated: true,
      role: roleData?.role || 'guest',  // Default to 'guest' if no role is found
    })
  } catch (error) {
    console.error("Error checking auth status:", error)
    return res.status(500).json({ authenticated: false })
  }
}
