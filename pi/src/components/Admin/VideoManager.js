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
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import Cookies from 'js-cookie';
import DirectUploadForm from './DirectUploadForm';

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Vérifier si les champs requis sont remplis
      if (!formData.title || !formData.description) {
        setSnackbar({
          open: true,
          message: 'Veuillez remplir tous les champs requis',
          severity: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      // Vérifier si un fichier vidéo est sélectionné pour un nouvel ajout
      if (!selectedVideo && !formData.videoUrl) {
        setSnackbar({
          open: true,
          message: 'Veuillez sélectionner un fichier vidéo',
          severity: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      const token = Cookies.get('token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('courseId', courseId);

      if (formData.videoUrl) {
        formDataToSend.append('video', formData.videoUrl);
        console.log('Fichier vidéo ajouté au FormData:', formData.videoUrl.name);
      }

      console.log('Envoi des données:', {
        title: formData.title,
        description: formData.description,
        courseId: courseId,
        hasVideo: !!formData.videoUrl
      });

      if (selectedVideo) {
        // Mise à jour d'une vidéo existante
        console.log('Mise à jour de la vidéo:', selectedVideo._id);

        try {
          const response = await axios.put(`https://ikramsegni.fr/api/videos/${selectedVideo._id}`, formDataToSend, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000 // 60 secondes
          });

          console.log('Réponse de mise à jour:', response.data);
          setSnackbar({
            open: true,
            message: 'Vidéo mise à jour avec succès',
            severity: 'success'
          });
          handleClose();
          fetchVideos();
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour de la vidéo:', updateError);
          setSnackbar({
            open: true,
            message: updateError.response?.data?.message || 'Erreur lors de la mise à jour de la vidéo',
            severity: 'error'
          });
        }
      } else {
        // Ajout d'une nouvelle vidéo
        console.log('Ajout d\'une nouvelle vidéo');

        // Utiliser le formulaire d'upload direct pour contourner les problèmes CORS
        setDirectUploadData({
          title: formData.title,
          description: formData.description,
          file: formData.videoUrl
        });
        setShowDirectUpload(true);

        // Note: Le reste du processus est géré par le composant DirectUploadForm
        // et ses gestionnaires d'événements (success, error, complete)
      }
    } catch (error) {
      console.error('Error saving video:', error);
      let errorMessage = 'Erreur lors de la sauvegarde de la vidéo';

      if (error.response) {
        console.error('Détails de l\'erreur:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        console.error('Pas de réponse du serveur:', error.request);
        errorMessage = 'Le serveur ne répond pas. Veuillez réessayer.';
      } else {
        console.error('Erreur de configuration:', error.message);
        errorMessage = error.message || errorMessage;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
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

  // État pour le formulaire d'upload direct
  const [showDirectUpload, setShowDirectUpload] = useState(false);
  const [directUploadData, setDirectUploadData] = useState(null);

  // Gestionnaires pour le composant DirectUploadForm
  const handleDirectUploadSuccess = (data) => {
    console.log('Upload réussi via formulaire direct:', data);
    setSnackbar({
      open: true,
      message: 'Vidéo ajoutée avec succès',
      severity: 'success'
    });
    setShowDirectUpload(false);
    setDirectUploadData(null);
    handleClose();
    fetchVideos();
  };

  const handleDirectUploadError = (error) => {
    console.error('Erreur lors de l\'upload via formulaire direct:', error);
    setSnackbar({
      open: true,
      message: error.message || 'Erreur lors de l\'upload de la vidéo',
      severity: 'error'
    });
    setShowDirectUpload(false);
    setDirectUploadData(null);
  };

  const handleDirectUploadComplete = () => {
    setIsSubmitting(false);
  };

  return (
    <Box>
      {/* Formulaire d'upload direct caché */}
      {showDirectUpload && directUploadData && (
        <DirectUploadForm
          courseId={courseId}
          title={directUploadData.title}
          description={directUploadData.description}
          file={directUploadData.file}
          onSuccess={handleDirectUploadSuccess}
          onError={handleDirectUploadError}
          onComplete={handleDirectUploadComplete}
        />
      )}

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
            <Button onClick={handleClose} disabled={isSubmitting}>Annuler</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={24} color="inherit" style={{ marginRight: '8px' }} />
                  Envoi en cours...
                </>
              ) : 'Ajouter'}
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
            <Button onClick={handleClose} disabled={isSubmitting}>Annuler</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={24} color="inherit" style={{ marginRight: '8px' }} />
                  Mise à jour...
                </>
              ) : 'Mettre à jour'}
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