// src/components/samples/AddSampleForm.tsx
import { useState } from 'react';
import { TextField, Button, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AddSampleFormProps {
  open: boolean;
  onClose: () => void;
  onSampleAdded: () => void;
  students: User[];
}

export default function AddSampleForm({ open, onClose, onSampleAdded, students }: AddSampleFormProps) {
  const [formData, setFormData] = useState({
    studentEmail: '',
    sampleName: '',
    sampleType: '',
    location: '',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setFormError('');
    
    // Validate form
    if (!formData.studentEmail || !formData.sampleName || !formData.sampleType || !formData.location) {
      setFormError('All fields are required');
      return;
    }

    try {
      const response = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Reset form and close dialog
        setFormData({
          studentEmail: '',
          sampleName: '',
          sampleType: '',
          location: '',
        });
        onClose();
        onSampleAdded();
      } else {
        const errorData = await response.json();
        setFormError(`Failed to create sample: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating sample:', error);
      setFormError('An error occurred while creating the sample');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Sample</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, minWidth: '400px' }}>
          {formError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {formError}
            </Typography>
          )}
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="student-label">Student</InputLabel>
            <Select
              labelId="student-label"
              name="studentEmail"
              value={formData.studentEmail}
              label="Student"
              onChange={handleSelectChange}
            >
              {students.map((student) => (
                <MenuItem key={student.email} value={student.email}>
                  {student.name} ({student.email})
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select the student this sample belongs to</FormHelperText>
          </FormControl>
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Sample Name"
            name="sampleName"
            value={formData.sampleName}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Sample Type"
            name="sampleType"
            value={formData.sampleType}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Add Sample</Button>
      </DialogActions>
    </Dialog>
  );
}