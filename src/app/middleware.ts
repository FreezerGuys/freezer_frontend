import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token)
    
    // Attach user data to the request
    req.headers.set('X-User-Id', decodedToken.uid)

    return NextResponse.next()
  } catch (error) {
    console.error('Auth Middleware Error:', error)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

// Apply middleware to protected routes
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'], // Add protected routes here
}
