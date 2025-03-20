import { useState } from 'react'
import Cookies from 'js-cookie'
import { Button, Box, Container, Alert } from '@mui/material'

interface props {
  handleSignupRedirect: () => void
  pushLogin: () => void
}
export default function DashboardPage({handleSignupRedirect, pushLogin}: props) {  // Assuming this is your dashboard or profile page
  
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
        pushLogin()  // Redirect to login page
      }, 1500)  // Delay to show the success message
    } catch (error) {
      setError('An error occurred while logging out. Please try again later.')
      console.error(error)
    }
  }

  

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        
        {/* Sign Up Button */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSignupRedirect}
          sx={{ mb: 2 }}
        >
          Sign Up
        </Button>

        {/* Success and error messages */}
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

        {/* Logout Button */}
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ mt: 8 }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  )
}
