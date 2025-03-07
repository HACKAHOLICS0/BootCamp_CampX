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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Assessment as AssessmentIcon } from '@mui/icons-material';

const ModuleManagement = () => {
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [currentStats, setCurrentStats] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    image: '',
    duration: '',
    difficulty: 'intermediate'
  });

  useEffect(() => {
    fetchModules();
    fetchCategories();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/modules');
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpen = (module = null) => {
    if (module) {
      setCurrentModule(module);
      setFormData(module);
      setEditMode(true);
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        image: '',
        duration: '',
        difficulty: 'intermediate'
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentModule(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      image: '',
      duration: '',
      difficulty: 'intermediate'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.patch(`/api/modules/${currentModule._id}`, formData);
      } else {
        await axios.post('/api/modules', formData);
      }
      fetchModules();
      handleClose();
    } catch (error) {
      console.error('Error saving module:', error);
    }
  };

  const handleDelete = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await axios.delete(`/api/modules/${moduleId}`);
        fetchModules();
      } catch (error) {
        console.error('Error deleting module:', error);
      }
    }
  };

  const handleViewStats = async (moduleId) => {
    try {
      const response = await axios.get(`/api/modules/statistics/${moduleId}`);
      setCurrentStats(response.data);
      setStatsOpen(true);
    } catch (error) {
      console.error('Error fetching module statistics:', error);
    }
  };

  return (
    <Container>
      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h4">Module Management</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Module
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{module.title}</Typography>
                <Typography color="textSecondary">{module.description}</Typography>
                <Typography variant="body2">
                  Category: {module.category?.name}
                </Typography>
                <Typography variant="body2">
                  Duration: {module.duration} hours
                </Typography>
                <Typography variant="body2">
                  Difficulty: {module.difficulty}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(module)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="info"
                  startIcon={<AssessmentIcon />}
                  onClick={() => handleViewStats(module._id)}
                >
                  Stats
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(module._id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit Module' : 'Add Module'}</DialogTitle>
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
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Image URL"
              fullWidth
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
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
            <FormControl fullWidth margin="dense">
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                required
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={statsOpen} onClose={() => setStatsOpen(false)}>
        <DialogTitle>Module Statistics</DialogTitle>
        <DialogContent>
          {currentStats && (
            <>
              <Typography>Total Students: {currentStats.totalStudents}</Typography>
              <Typography>Average Rating: {currentStats.averageRating}</Typography>
              <Typography>Completion Rate: {currentStats.completionRate}%</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModuleManagement;
