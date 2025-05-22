// src/pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebaseAdmin';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify the user is authenticated and has appropriate role
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get the user's role from Firestore
    const userDoc = await admin.firestore().collection('users').where('uid', '==', uid).get();
    
    if (userDoc.empty) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userData = userDoc.docs[0].data();
    const userRole = userData.role;
    
    // GET method - fetch users based on role
    if (req.method === 'GET') {
      // Role-based access control
      if (userRole === 'superadmin') {
        // Superadmins can see all users
        const usersSnapshot = await admin.firestore().collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(users);
      } else if (userRole === 'admin') {
        // Admins can only see students
        const studentsSnapshot = await admin.firestore().collection('users')
          .where('role', '==', 'student')
          .get();
        const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(students);
      } else {
        // Students can't access user lists
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    
    // POST method - create a new user
    else if (req.method === 'POST') {
      const { email, name, role: newUserRole } = req.body;
      
      // Role-based access control for user creation
      if (
        (userRole === 'admin' && newUserRole === 'student') || 
        (userRole === 'superadmin')
      ) {
        try {
          // Create user in Firebase Auth
          const userRecord = await admin.auth().createUser({
            email,
            password: 'DefaultTemp123!', // Temporary password
          });
          
          // Store user data in Firestore
          await admin.firestore().collection('users').doc(email).set({
            name,
            email,
            role: newUserRole,
            uid: userRecord.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          // Send password reset email
          await admin.auth().generatePasswordResetLink(email);
          
          return res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
          console.error('Error creating user:', error);
          return res.status(500).json({ error: 'Failed to create user' });
        }
      } else {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}