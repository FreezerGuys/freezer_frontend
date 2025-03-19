import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'
import { TextField, Button, Box, Typography, Container, Alert } from '@mui/material'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)  // State to hold success message

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)  // Clear previous errors
    setSuccess(null) // Clear previous success messages

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (response.ok) {
      const data = await response.json()
      Cookies.set('auth_token', data.token, { expires: 7, secure: process.env.NODE_ENV === 'production' })
      setSuccess('Login successful! Redirecting...')  // Show success message
      setTimeout(() => {
        router.push('/') // Redirect to home page after a short delay
      }, 1500)  // Delay the redirect to show the success alert
    } else {
      const errorData = await response.json()
      setError(errorData.message || 'Login failed. Please try again.')
    }
  }

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField fullWidth margin="normal" label="Email" name="email" type="email" required />
          <TextField fullWidth margin="normal" label="Password" name="password" type="password" required />
          <Button fullWidth variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>Login</Button>
        </form>
      </Box>
    </Container>
  )
}
