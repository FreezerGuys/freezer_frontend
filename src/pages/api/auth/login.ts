import type { NextApiRequest, NextApiResponse } from 'next'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../lib/firebase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { email, password } = req.body

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    const token = await user.getIdToken()

    res.setHeader('Set-Cookie',
       `auth_token=${token}; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict`)

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials.' })
    console.error(error)
  }
}
