import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import Cookies from 'js-cookie';

const VideoManager = ({ courseId }) => {
  const [videos, setVideos] = useState([]);
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchVideos();
  }, [courseId]);

  const fetchVideos = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`https://ikramsegni.fr/api/videos/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la récupération des vidéos',
        severity: 'error'
      });
    }
  };

  const handleOpen = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setOpenEdit(false);
    setSelectedVideo(null);
  };

  const handleOpenEdit = (video) => {
    setSelectedVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl
    });
    setOpenEdit(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = Cookies.get('token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('courseId', courseId);
      if (formData.videoUrl) {
        formDataToSend.append('video', formData.videoUrl);
      }

      if (selectedVideo) {
        await axios.put(`https://ikramsegni.fr/api/videos/${selectedVideo._id}`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSnackbar({
          open: true,
          message: 'Vidéo mise à jour avec succès',
          severity: 'success'
        });
      } else {
        await axios.post('https://ikramsegni.fr/api/videos', formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSnackbar({
          open: true,
          message: 'Vidéo ajoutée avec succès',
          severity: 'success'
        });
      }
      handleClose();
      fetchVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erreur lors de la sauvegarde de la vidéo',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (videoId) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(`https://ikramsegni.fr/api/videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSnackbar({
        open: true,
        message: 'Vidéo supprimée avec succès',
        severity: 'success'
      });
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erreur lors de la suppression de la vidéo',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Liste des vidéos</Typography>
        <button
          className="action-btn add"
          onClick={handleOpen}
        >
          Ajouter une vidéo
        </button>
      </Box>

      <table className="data-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.length > 0 ? (
            videos.map((video) => (
              <tr key={video._id}>
                <td>{video.title}</td>
                <td>{video.description}</td>
                <td className="action-buttons">
                  <button className="action-btn modify" onClick={() => handleOpenEdit(video)}>
                    Modifier
                  </button>
                  <button className="action-btn delete" onClick={() => handleDelete(video._id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr className="no-data">
              <td colSpan="3">Aucune vidéo trouvée</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Dialog pour ajouter une vidéo */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Ajouter une nouvelle vidéo</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Titre"
              type="text"
              fullWidth
              value={formData.title}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              value={formData.description}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="videoUrl"
              label="URL de la vidéo"
              type="file"
              fullWidth
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.files[0] })}
              required
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              Ajouter
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog pour éditer une vidéo */}
      <Dialog open={openEdit} onClose={handleClose}>
        <DialogTitle>Modifier la vidéo</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Titre"
              type="text"
              fullWidth
              value={formData.title}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              value={formData.description}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="videoUrl"
              label="Nouvelle vidéo (optionnel)"
              type="file"
              fullWidth
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.files[0] })}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              Mettre à jour
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VideoManager;