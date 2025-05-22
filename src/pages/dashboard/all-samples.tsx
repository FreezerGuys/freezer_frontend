// src/pages/dashboard/all-samples.tsx
import { useEffect, useState } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AddSampleForm from '../../pages/api/samples/AddSampleForm';

interface Sample {
  id: string;
  sampleName: string;
  sampleType: string;
  location: string;
  studentEmail: string;
  createdAt: { seconds: number; nanoseconds: number };
  createdBy: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AllSamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchSamples(),
      fetchStudents()
    ]).then(() => setLoading(false));
  }, []);

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
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.filter((user: User) => user.role === 'student'));
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (confirm('Are you sure you want to delete this sample?')) {
      try {
        const response = await fetch(`/api/samples/${sampleId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          // Remove the deleted sample from the state
          setSamples(samples.filter(sample => sample.id !== sampleId));
        } else {
          const errorData = await response.json();
          alert(`Failed to delete sample: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting sample:', error);
        alert('An error occurred while deleting the sample');
      }
    }
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const getStudentName = (email: string) => {
    const student = students.find(s => s.email === email);
    return student ? student.name : email;
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <DashboardLayout title="Manage Samples">
        <Box>
          <Box justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4">All Samples</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
              >
                Add Sample
              </Button>
            </Box>

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
                    <TableCell>Student</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {samples.map((sample) => (
                    <TableRow key={sample.id}>
                      <TableCell>{sample.sampleName}</TableCell>
                      <TableCell>{sample.sampleType}</TableCell>
                      <TableCell>{sample.location}</TableCell>
                      <TableCell>{getStudentName(sample.studentEmail)}</TableCell>
                      <TableCell>{formatDate(sample.createdAt)}</TableCell>
                      <TableCell>
                        <IconButton 
                          aria-label="delete" 
                          color="error"
                          onClick={() => handleDeleteSample(sample.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Add Sample Dialog */}
        <AddSampleForm 
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          onSampleAdded={fetchSamples}
          students={students}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}