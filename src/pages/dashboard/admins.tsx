// src/pages/dashboard/admins.tsx
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

export default function AdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.filter((user: User) => user.role === 'admin'));
      } else {
        console.error('Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      try {
        const response = await fetch(`/api/users/${email}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          // Remove the deleted admin from the state
          setAdmins(admins.filter(admin => admin.email !== email));
        } else {
          const errorData = await response.json();
          alert(`Failed to delete admin: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('An error occurred while deleting the admin');
      }
    }
  };

  const handleAddAdmin = async () => {
    setFormError('');
    
    if (!newAdmin.name || !newAdmin.email) {
      setFormError('Name and email are required');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          role: 'admin',
        }),
      });

      if (response.ok) {
        // Reset form and close dialog
        setNewAdmin({ name: '', email: '' });
        setOpenDialog(false);
        // Refresh the admin list
        fetchAdmins();
      } else {
        const errorData = await response.json();
        setFormError(`Failed to create admin: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setFormError('An error occurred while creating the admin');
    }
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number } | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <ProtectedRoute allowedRoles={['superadmin']}>
      <DashboardLayout title="Manage Admins">
        <Box>
          <Box justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4">Admins</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add Admin
              </Button>
            </Box>

          {loading ? (
            <Typography>Loading admins...</Typography>
          ) : admins.length === 0 ? (
            <Typography>No admins found.</Typography>
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
                  {admins.map((admin) => (
                    <TableRow key={admin.email}>
                      <TableCell>{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{formatDate(admin.createdAt)}</TableCell>
                      <TableCell>
                        <IconButton 
                          aria-label="delete" 
                          color="error"
                          onClick={() => handleDeleteAdmin(admin.email)}
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

        {/* Add Admin Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Add New Admin</DialogTitle>
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
                label="Admin Name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Admin Email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAddAdmin} variant="contained">Add Admin</Button>
          </DialogActions>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}