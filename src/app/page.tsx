"use client"

import { useState, useEffect } from "react"
import { Box } from "@mui/material"
import DashboardPage from "@/pages/dashboard"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getFirestore, serverTimestamp } from "firebase/firestore"
import { auth } from "@/lib/firebase"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const router = useRouter()

  const handleSignupRedirect = () => {
    router.push("/signup")
  }

  const pushLogin = () => {
    router.push("/login")
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false)
        setRole(null)
        setUserId(null)
        setEmail(null)
        setHasCheckedAuth(true)
        router.replace("/login")
        return
      }

      try {
        const tokenResult = await user.getIdTokenResult()
        const userRole = (tokenResult.claims.role as string) ?? "user"

        setRole(userRole)
        setUserId(user.uid)
        setEmail(user.email ?? null)
        setIsAuthenticated(true)

        const db = getFirestore()
        await setDoc(
          doc(db, "Users", user.uid),
          {
            uid: user.uid,
            email: user.email ?? "",
            role: userRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (error) {
        console.error("Auth check failed:", error)
        router.replace("/login")
      } finally {
        setHasCheckedAuth(true)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!hasCheckedAuth) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </Box>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box>
      <DashboardPage
        handleSignupRedirect={handleSignupRedirect}
        pushLogin={pushLogin}
        role={role}
        userId={userId ?? undefined}
        email={email ?? undefined}
      />
    </Box>
  )
}
