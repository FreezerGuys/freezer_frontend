// src/pages/dashboard/samples.tsx
import { useEffect, useState } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Sample {
  id: string;
  sampleName: string;
  sampleType: string;
  location: string;
  createdAt: { seconds: number; nanoseconds: number };
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await fetch('/api/samples', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setSamples(data);
        } else {
          console.error('Failed to fetch samples');
        }
      } catch (error) {
        console.error('Error fetching samples:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <ProtectedRoute allowedRoles={['student', 'admin', 'superadmin']}>
      <DashboardLayout title="My Samples">
        <Box>
          <Typography variant="h4" gutterBottom>
            Samples
          </Typography>

          {loading ? (
            <Typography>Loading samples...</Typography>
          ) : samples.length === 0 ? (
            <Typography>No samples found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sample Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Created Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {samples.map((sample) => (
                    <TableRow key={sample.id}>
                      <TableCell>{sample.sampleName}</TableCell>
                      <TableCell>{sample.sampleType}</TableCell>
                      <TableCell>{sample.location}</TableCell>
                      <TableCell>{formatDate(sample.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}