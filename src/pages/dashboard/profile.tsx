// src/pages/dashboard/profile.tsx
import { useState, useEffect } from 'react';
import { Typography, Box, Button, TextField, Paper, Avatar, Divider, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth, updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProfilePage() {
  const { user, role } = useAuth();
  const auth = getAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: user?.email || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.email) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.email));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileData({
              name: userData.name || '',
              email: userData.email || user.email,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const updateProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Update name in Firestore
      if (user?.email) {
        await updateDoc(doc(db, 'users', user.email), {
          name: profileData.name,
        });
        
        // Update email if changed
        if (profileData.email !== user.email && user) {
          // Requires re-authentication for email change
          if (!passwordData.currentPassword) {
            setError('Current password is required to change email');
            setLoading(false);
            return;
          }
          
          const credential = EmailAuthProvider.credential(
            user.email,
            passwordData.currentPassword
          );
          
          await reauthenticateWithCredential(user, credential);
          await updateEmail(user, profileData.email);
          
          // Update email in Firestore
          const newUserDoc = doc(db, 'users', profileData.email);
          const oldUserDoc = doc(db, 'users', user.email);
          
          const userData = (await getDoc(oldUserDoc)).data();
          if (userData) {
            await updateDoc(newUserDoc, {
              ...userData,
              email: profileData.email,
            });
            
            // Delete old document
            await updateDoc(oldUserDoc, { deleted: true });
          }
        }
        
        setSuccess('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.email) {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          passwordData.currentPassword
        );
        
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password
        await updatePassword(currentUser, passwordData.newPassword);
        
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        setSuccess('Password updated successfully');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please ensure your current password is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student', 'admin', 'superadmin']}>
      <DashboardLayout title="Profile">
        <Box maxWidth="md" mx="auto">
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
                {profileData.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5">{profileData.name}</Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Role: { role ? role?.charAt(0).toUpperCase() + role?.slice(1) : 'Error'}
                </Typography>
              </Box>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={updateProfileInfo}>
              <Box>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                
                {profileData.email !== user?.email && (
                    <TextField
                      fullWidth
                      label="Current Password (required for email change)"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                    />
                )}
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={loading}
                  >
                    Update Profile
                  </Button>
                </Box>
            </form>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={updateUserPassword}>
              <Box>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={loading}
                  >
                    Update Password
                  </Button>
                </Box>
            </form>
          </Paper>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}