"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { Box, Button, Typography, Container, Alert } from "@mui/material";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the user is logged in by checking for the 'auth_token' in cookies
    const token = Cookies.get("auth_token");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    try {
      // Remove the auth_token from cookies
      Cookies.remove("auth_token");
      setIsLoggedIn(false);
    } catch (error) {
      setError("An error occurred while logging out. Please try again later.");
      console.error(error)
    }
  };

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Typography variant="h4" gutterBottom>
          {isLoggedIn ? "Dashboard" : "Welcome to Our App"}
        </Typography>

        {error && <Alert severity="error" sx={{ width: "100%", mb: 2 }}>{error}</Alert>}

        {/* Conditional Rendering */}
        {isLoggedIn ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Welcome to your dashboard!
            </Typography>
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
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Please log in to access your dashboard
            </Typography>
            <Link href="/login">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Login
              </Button>
            </Link>
          </Box>
        )}
      </Box>
    </Container>
  );
}
