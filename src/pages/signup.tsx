"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button, TextField, Box, Typography, Container, Alert } from '@mui/material'
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { getFirestore, setDoc, doc } from 'firebase/firestore'
import { app } from '../lib/firebase'

const db = getFirestore(app)
const auth = getAuth(app)

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'superadmin' | 'guest' | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/status', { credentials: 'include' })
        const data = await res.json()

        if (!data.authenticated) {
          setError('You must be logged in to create student accounts.')
          router.push('/login')  // Redirect to login if not logged in
          return
        }

        // Set logged-in status and role
        setIsLoggedIn(true)
        setUserRole(data.role)
      } catch (error) {
        setError('Error checking user authentication status.')
        console.error(error)
      }
    }

    checkAuth()
  }, [router])

  const handleSignup = async () => {
    if (!isLoggedIn || (userRole !== 'admin' && userRole !== 'superadmin')) {
      setError('You do not have permission to create student accounts.')
      return
    }

    setLoading(true)
    try {
      // Create a user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, 'defaultPassword123') // Password is not used, we will send a reset link
      const user = userCredential.user

      // Create student user in Firestore
      await setDoc(doc(db, 'users', email), {
        name,
        email,
        role: 'student',
        uid: user.uid,  // Store Firebase UID
      })

      // Send password reset email to the student
      await sendPasswordResetEmail(auth, email)

      setSuccess('Student account created successfully! A password reset link has been sent to the student email.')
      setTimeout(() => {
        router.push('/dashboard') // Redirect to dashboard or another page
      }, 1500)
    } catch (error) {
      setError((error as Error).message)
      console.error('Signup error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Typography variant="h5" gutterBottom>Create Student Account</Typography>

        {/* Error and success messages */}
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

        {/* Form Fields */}
        <TextField
          label="Student Name"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Student Email"
          type="email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Sign Up Button */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSignup}
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Student Account'}
        </Button>
      </Box>
    </Container>
  )
}
