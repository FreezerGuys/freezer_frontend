import type { NextApiRequest, NextApiResponse } from 'next'
import admin from '../../../lib/firebaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  try {
    // Authenticate with Firebase REST API
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      }
    )

    if (!authResponse.ok) {
      const errorData = await authResponse.json()
      console.error('Firebase auth error:', errorData)
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const authData = await authResponse.json()
    const idToken = authData.idToken
    const uid = authData.localId

    // Get user record from Admin SDK to get role
    const userRecord = await admin.auth().getUser(uid)
    const role = userRecord.customClaims?.role || 'user'

    // Set secure HTTP-only cookie with ID token
    res.setHeader('Set-Cookie', [
      `auth_token=${idToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`,
      `auth_role=${role}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
    ])

    return res.status(200).json({ 
      success: true,
      token: idToken,
      uid,
      role,
      message: 'Login successful'
    })
  } catch (error: unknown) {
    console.error('Login error:', error instanceof Error ? error.message : error)
    return res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}