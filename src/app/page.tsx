"use client"

import { useState, useEffect } from "react"
import { Box, Button, Typography, Container } from "@mui/material"
import DashboardPage from "@/pages/dashboard" 
import { useRouter } from "next/navigation"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  const handleSignupRedirect = () => {
    router.push('/signup')  // Navigate to the Sign Up page
  }

  const pushLogin = () => {
    router.push('/login')
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/status", { credentials: "include" })
        const data = await res.json()
        setIsLoggedIn(data.authenticated)
      } catch (error) {
        console.error("Error checking auth status:", error)
      }
    }

    checkAuth()
  }, [])

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Typography variant="h4" gutterBottom>
          {isLoggedIn ? "Dashboard" : "Welcome to Our App"}
        </Typography>

        {isLoggedIn ? (
          <Box>
            {/* Pass router functions as props */}
            <DashboardPage handleSignupRedirect={handleSignupRedirect} pushLogin={pushLogin}/>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Please log in to access your dashboard
            </Typography>
            <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>
              Login
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  )
}
