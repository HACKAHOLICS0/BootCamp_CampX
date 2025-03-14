import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: '',
    content: '',
    price: '',
    duration: '',
  });

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/modules');
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleOpen = (course = null) => {
    if (course) {
      setCurrentCourse(course);
      setFormData(course);
      setEditMode(true);
    } else {
      setFormData({
        title: '',
        description: '',
        module: '',
        content: '',
        price: '',
        duration: '',
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCourse(null);
    setFormData({
      title: '',
      description: '',
      module: '',
      content: '',
      price: '',
      duration: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.patch(`/api/courses/${currentCourse._id}`, formData);
      } else {
        await axios.post('/api/courses', formData);
      }
      fetchCourses();
      handleClose();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleArchive = async (courseId) => {
    if (window.confirm('Are you sure you want to archive this course?')) {
      try {
        await axios.patch(`/api/courses/${courseId}/archive`);
        fetchCourses();
      } catch (error) {
        console.error('Error archiving course:', error);
      }
    }
  };

  return (
    <Container>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Course Management</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Course
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{course.title}</Typography>
                <Typography color="textSecondary">{course.description}</Typography>
                <Typography variant="body2">
                  Module: {course.module?.title}
                </Typography>
                <Typography variant="body2">
                  Price: ${course.price}
                </Typography>
                <Typography variant="body2">
                  Duration: {course.duration} hours
                </Typography>
                {course.isArchived && (
                  <Chip
                    label="Archived"
                    color="warning"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(course)}
                  disabled={course.isArchived}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="warning"
                  startIcon={<ArchiveIcon />}
                  onClick={() => handleArchive(course._id)}
                  disabled={course.isArchived}
                >
                  Archive
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit Course' : 'Add Course'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Module</InputLabel>
              <Select
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                required
              >
                {modules.map((module) => (
                  <MenuItem key={module._id} value={module._id}>
                    {module.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Content"
              fullWidth
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Price"
              type="number"
              fullWidth
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Duration (hours)"
              type="number"
              fullWidth
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default CourseManagement;
