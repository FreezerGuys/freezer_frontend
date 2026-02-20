"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button, TextField, Box, Typography, Container, Alert } from '@mui/material'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('You must be logged in to create student accounts.')
        router.push('/login')
        return
      }
      try {
        const tokenResult = await user.getIdTokenResult()
        const role = (tokenResult.claims.role as string) ?? 'user'
        setIsLoggedIn(true)
        setUserRole(role)
      } catch {
        setError('Error checking user authentication status.')
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSignup = async () => {
    if (!isLoggedIn || (userRole !== 'admin' && userRole !== 'superadmin')) {
      setError('You do not have permission to create student accounts.')
      return
    }

    setLoading(true)
    try {
      // Create a user in Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, 'defaultPassword123') // Password reset link sent below
      // Send password reset email to the student
      await sendPasswordResetEmail(auth, email)

      setSuccess('Student account created successfully! A password reset link has been sent to the student email.')
      setTimeout(() => {
        router.push('/') // Redirect to dashboard or another page
      }, 1500)
    } catch (error: unknown) {
  const err = error as { code?: string; message?: string }
  if (err.code === 'auth/email-already-in-use') {
    setError('This email is already associated with an account. Please use a different email or ask the student to reset their password.')
  } else {
    setError(err.message ?? 'An unexpected error occurred.')
  }
  console.error('Signup error:', error)
}
 finally {
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
