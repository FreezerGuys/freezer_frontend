// src/pages/api/users/[email].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify and decode token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get the user's role
    const userDoc = await admin.firestore().collection('users').where('uid', '==', uid).get();
    
    if (userDoc.empty) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userData = userDoc.docs[0].data();
    const userRole = userData.role;
    
    // DELETE method
    if (req.method === 'DELETE') {
      // Get the user to be deleted
      const targetUserDoc = await admin.firestore().collection('users').doc(email as string).get();
      
      if (!targetUserDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const targetUserData = targetUserDoc.data();
      const targetUserRole = targetUserData?.role;
      
      // Check permissions
      if (
        (userRole === 'admin' && targetUserRole === 'student') ||
        (userRole === 'superadmin')
      ) {
        // Delete user from Firebase Auth
        const userRecord = await admin.auth().getUserByEmail(email as string);
        await admin.auth().deleteUser(userRecord.uid);
        
        // Delete user data from Firestore
        await admin.firestore().collection('users').doc(email as string).delete();
        
        return res.status(200).json({ message: 'User deleted successfully' });
      } else {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}