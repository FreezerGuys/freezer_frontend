// src/pages/dashboard/index.tsx
import { useEffect, useState } from 'react';
import { Typography, Box, Card, CardContent, Grid } from '@mui/material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { user, role } = useAuth();
  const [sampleCount, setSampleCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch samples count
        const samplesRes = await fetch('/api/samples', { credentials: 'include' });
        if (samplesRes.ok) {
          const samplesData = await samplesRes.json();
          setSampleCount(samplesData.length);
        }

        // Fetch user count for admins and superadmins
        if (role === 'admin' || role === 'superadmin') {
          const usersRes = await fetch('/api/users', { credentials: 'include' });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUserCount(usersData.length);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [role]);

  return (
    <ProtectedRoute allowedRoles={['student', 'admin', 'superadmin']}>
      <DashboardLayout title="Dashboard">
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.email}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Role: { role ? role?.charAt(0).toUpperCase() + role?.slice(1) : 'Error'}
          </Typography>

          <Box sx={{ mt: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Samples
                  </Typography>
                  <Typography variant="h3">{sampleCount}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role === 'student' ? 'Your samples' : 'Total samples'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {(role === 'admin' || role === 'superadmin') && (
              <Box sx={{ mt: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      Users
                    </Typography>
                    <Typography variant="h3">{userCount}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {role === 'admin' ? 'Student users' : 'Total users'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}