// src/pages/dashboard/students.tsx
import { useEffect, useState } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (email: string) => {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      try {
        const response = await fetch(`/api/users/${email}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          // Remove the deleted student from the state
          setStudents(students.filter(student => student.email !== email));
        } else {
          const errorData = await response.json();
          alert(`Failed to delete student: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('An error occurred while deleting the student');
      }
    }
  };

  const handleAddStudent = async () => {
    setFormError('');
    
    if (!newStudent.name || !newStudent.email) {
      setFormError('Name and email are required');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newStudent.name,
          email: newStudent.email,
          role: 'student',
        }),
      });

      if (response.ok) {
        // Reset form and close dialog
        setNewStudent({ name: '', email: '' });
        setOpenDialog(false);
        // Refresh the student list
        fetchStudents();
      } else {
        const errorData = await response.json();
        setFormError(`Failed to create student: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating student:', error);
      setFormError('An error occurred while creating the student');
    }
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number } | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <DashboardLayout title="Manage Students">
        <Box>
          <Box justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4">Students</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add Student
              </Button>
            </Box>

          {loading ? (
            <Typography>Loading students...</Typography>
          ) : students.length === 0 ? (
            <Typography>No students found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.email}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{formatDate(student.createdAt)}</TableCell>
                      <TableCell>
                        <IconButton 
                          aria-label="delete" 
                          color="error"
                          onClick={() => handleDeleteStudent(student.email)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                      // src/pages/dashboard/students.tsx (continued)
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Add Student Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              {formError && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {formError}
                </Typography>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Student Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Student Email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} variant="contained">Add Student</Button>
          </DialogActions>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}