// src/pages/api/samples/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify and decode token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get the user's info
    const userDoc = await admin.firestore().collection('users').where('uid', '==', uid).get();
    
    if (userDoc.empty) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userData = userDoc.docs[0].data();
    const userRole = userData.role;
    const userEmail = userData.email;
    
    // GET method - fetch samples
    if (req.method === 'GET') {
      let samplesQuery;
      
      if (userRole === 'superadmin' || userRole === 'admin') {
        // Admins and superadmins can see all samples
        samplesQuery = admin.firestore().collection('samples');
      } else {
        // Students can only see their own samples
        samplesQuery = admin.firestore().collection('samples').where('studentEmail', '==', userEmail);
      }
      
      const samplesSnapshot = await samplesQuery.get();
      const samples = samplesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return res.status(200).json(samples);
    }
    
    // POST method - create a new sample
    else if (req.method === 'POST') {
      // Only admins and superadmins can create samples
      if (userRole === 'admin' || userRole === 'superadmin') {
        const { studentEmail, sampleName, sampleType, location } = req.body;
        
        try {
          const newSample = {
            studentEmail,
            sampleName,
            sampleType,
            location,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: userEmail,
          };
          
          const docRef = await admin.firestore().collection('samples').add(newSample);
          
          return res.status(201).json({ 
            id: docRef.id,
            ...newSample
          });
        } catch (error) {
          console.error('Error creating sample:', error);
          return res.status(500).json({ error: 'Failed to create sample' });
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