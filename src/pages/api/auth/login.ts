import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import Cookies from 'cookies'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { email, password } = req.body
  const auth = getAuth()

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log(userCredential)
    const user = userCredential.user
    const token = await user.getIdToken()

    const cookies = new Cookies(req, res)
    cookies.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials.' })
    console.error(error)
  }
}
