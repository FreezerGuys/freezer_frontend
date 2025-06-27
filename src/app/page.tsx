"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Container } from "@mui/material"
import DashboardPage from "@/pages/dashboard"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null) 
  const router = useRouter()

  const handleSignupRedirect = () => {
    router.push("/signup")
  }

  const pushLogin = () => {
    router.push("/login")
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/status", { credentials: "include" })
        const data = await res.json()

        if (!data.authenticated) {
          router.push("/login")
        } else {
          setRole(data.role)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return null // Or a loading spinner
  }

  return (
    <Container disableGutters>
        <DashboardPage
          handleSignupRedirect={handleSignupRedirect}
          pushLogin={pushLogin}
          role={role}
        />
    </Container>
  )
}
