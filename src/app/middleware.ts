import { NextRequest, NextResponse } from 'next/server'
// Adjust the import path below to the correct relative path where firebaseAdmin.ts is located
import admin from '../lib/firebaseAdmin'
const serviceAccount = require('freezer-poc-firebase-adminsdk-fbsvc-7a272ae53f.json') // Adjust the path to your service account key

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://freezer-poc-default-rtdb.firebaseio.com"
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
  matcher: ['/dashboard/:path*', '/profile/:path*', '*'], // Add protected routes here
}
