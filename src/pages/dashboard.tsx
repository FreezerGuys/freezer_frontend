import { useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'
import { Button, Box, Typography, Container, Alert } from '@mui/material'

export default function DashboardPage() {  // Assuming this is your dashboard or profile page
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogout = () => {
    try {
      // Remove the auth_token from cookies
      Cookies.remove('auth_token')

      // Show success message
      setSuccess('You have successfully logged out!')

      // Redirect the user after a short delay
      setTimeout(() => {
        router.push('/login')  // Redirect to login page
      }, 1500)  // Delay to show the success message
    } catch (error) {
      setError('An error occurred while logging out. Please try again later.')
      console.error(error)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Typography variant="h5" gutterBottom>Dashboard</Typography>
        
        {/* Success and error messages */}
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

        {/* Logout Button */}
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ mt: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  )
}
