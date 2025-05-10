import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import YouTubeRecommendedVideos from '../courses/YouTubeRecommendedVideos';
import VideoUnavailable from './VideoUnavailable';
import axios from 'axios';
import Cookies from 'js-cookie';

const ExternalVideoPlayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [embedHtml, setEmbedHtml] = useState('');
  const [isEmbeddable, setIsEmbeddable] = useState(true);
  const [videoInfo, setVideoInfo] = useState({
    title: 'Vidéo externe',
    platform: '',
    category: '',
    description: ''
  });
  const [embedType, setEmbedType] = useState('iframe'); // iframe, html, video-js, custom

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const url = params.get('url');

    if (!url) {
      setError('URL de vidéo manquante');
      setLoading(false);
      return;
    }

    // Stocker l'URL originale
    setOriginalUrl(url);

    // Fonction pour détecter la plateforme
    const detectPlatform = (url) => {
      const platforms = [
        { name: 'Coursera', pattern: 'coursera.org' },
        { name: 'Udemy', pattern: 'udemy.com' },
        { name: 'YouTube', pattern: 'youtube.com' },
        { name: 'YouTube', pattern: 'youtu.be' },
        { name: 'edX', pattern: 'edx.org' },
        { name: 'Khan Academy', pattern: 'khanacademy.org' }
      ];

      return platforms.find(p => url.includes(p.pattern)) || { name: 'Autre', pattern: '' };
    };

    // Extraire des informations de base de l'URL
    const platform = detectPlatform(url);

    // Extraire des informations de l'URL
    let category = '';
    let title = `Vidéo de ${platform.name}`;

    // Extraire des informations spécifiques à la plateforme
    if (platform.name === 'Coursera' && url.includes('/lecture/')) {
      const parts = url.split('/');
      const lectureIndex = parts.findIndex(part => part === 'lecture');
      if (lectureIndex > 0) {
        if (lectureIndex - 2 >= 0) {
          category = parts[lectureIndex - 2].replace(/-/g, ' ');
        }
        if (parts[lectureIndex + 1]) {
          title = parts[lectureIndex + 1].replace(/-/g, ' ');
          // Mettre en majuscule la première lettre de chaque mot
          title = title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      }
    } else if (platform.name === 'YouTube') {
      try {
        // Essayer d'extraire le titre de la vidéo YouTube depuis l'URL
        const videoId = url.includes('watch?v=')
          ? new URL(url).searchParams.get('v')
          : url.includes('youtu.be/')
            ? url.split('youtu.be/')[1].split('?')[0]
            : null;

        if (videoId) {
          // Nous ne pouvons pas récupérer le titre sans API, donc utiliser un titre générique
          title = `Vidéo YouTube`;
          category = 'vidéo';
        }
      } catch (e) {
        console.error('Erreur lors de l\'extraction des informations YouTube:', e);
      }
    }

    // Définir les informations de la vidéo
    setVideoInfo({
      title: title,
      platform: platform.name,
      category: category || 'programmation',
      description: ''
    });

    // Utiliser notre proxy pour récupérer l'URL d'intégration
    const fetchEmbedUrl = async () => {
      try {
        // Créer une instance axios avec le token d'authentification
        const axiosInstance = axios.create({
          baseURL: 'https://ikramsegni.fr/api',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('token')}`
          }
        });

        // Appeler notre API de proxy
        const response = await axiosInstance.get(`/video-proxy/embed?url=${encodeURIComponent(url)}`);

        if (response.data.success) {
          // Mettre à jour les informations de la vidéo avec les données du serveur
          if (response.data.title) {
            setVideoInfo(prev => ({
              ...prev,
              title: response.data.title || prev.title,
              platform: response.data.platform || prev.platform,
              description: response.data.description || ''
            }));
          }

          // Vérifier si la vidéo peut être intégrée
          if (response.data.canEmbed === false) {
            setIsEmbeddable(false);
            setLoading(false);
            return;
          }

          // Si nous avons une URL d'intégration
          if (response.data.embedUrl) {
            setVideoUrl(response.data.embedUrl);
            setEmbedType('iframe');
            setIsEmbeddable(true);
          }
          // Si nous avons du HTML à intégrer directement
          else if (response.data.embedHtml) {
            setVideoUrl(url); // Garder l'URL originale pour les liens
            setEmbedType('html');
            setIsEmbeddable(true);
            // Créer un blob URL pour le contenu HTML
            const htmlBlob = new Blob([response.data.embedHtml], { type: 'text/html' });
            setEmbedHtml(URL.createObjectURL(htmlBlob));
          } else {
            // Si nous n'avons ni URL ni HTML, la vidéo n'est pas intégrable
            setIsEmbeddable(false);
          }

          setLoading(false);

          if (response.data.canEmbed !== false) {
            setSnackbarMessage(`Lecture de la vidéo de ${platform.name} sur notre plateforme`);
            setSnackbarOpen(true);
          }
        } else {
          // En cas d'échec, marquer comme non intégrable
          setIsEmbeddable(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'URL d\'intégration:', error);

        // Fallback: utiliser l'URL directement pour YouTube
        if (platform.name === 'YouTube') {
          let embedUrl = url;
          if (url.includes('watch?v=')) {
            const videoId = new URL(url).searchParams.get('v');
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
          } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
          }
          setVideoUrl(embedUrl);
          setEmbedType('iframe');
          setIsEmbeddable(true);
          setLoading(false);
        } else {
          // Marquer la vidéo comme non intégrable
          setIsEmbeddable(false);
          setLoading(false);
        }
      }
    };

    fetchEmbedUrl();
  }, [location]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if (iframeRef.current.mozRequestFullScreen) {
        iframeRef.current.mozRequestFullScreen();
      } else if (iframeRef.current.webkitRequestFullscreen) {
        iframeRef.current.webkitRequestFullscreen();
      } else if (iframeRef.current.msRequestFullscreen) {
        iframeRef.current.msRequestFullscreen();
      }
    }
  };

  // Rendu du lecteur vidéo selon le type d'intégration
  const renderVideoPlayer = () => {
    switch (embedType) {
      case 'iframe':
        return (
          <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%', bgcolor: '#000' }}>
            <iframe
              ref={iframeRef}
              src={videoUrl}
              title={videoInfo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                p: 1,
                display: 'flex',
                gap: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                borderRadius: '0 0 0 8px'
              }}
            >
              <IconButton
                size="small"
                sx={{ color: 'white' }}
                onClick={handleFullscreen}
                title="Plein écran"
              >
                <FullscreenIcon />
              </IconButton>
            </Box>
          </Box>
        );
      case 'html':
        return (
          <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%', bgcolor: '#000' }}>
            <iframe
              ref={iframeRef}
              src={embedHtml}
              title={videoInfo.title}
              frameBorder="0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                p: 1,
                display: 'flex',
                gap: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                borderRadius: '0 0 0 8px'
              }}
            >
              <IconButton
                size="small"
                sx={{ color: 'white' }}
                onClick={handleFullscreen}
                title="Plein écran"
              >
                <FullscreenIcon />
              </IconButton>
            </Box>
          </Box>
        );
      default:
        return (
          <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%', bgcolor: '#000' }}>
            <iframe
              src={videoUrl}
              title={videoInfo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
            />
          </Box>
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {videoInfo.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Source: {videoInfo.platform}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : !isEmbeddable ? (
        <VideoUnavailable videoInfo={videoInfo} originalUrl={originalUrl} />
      ) : (
        <Box>
          <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
            {renderVideoPlayer()}

            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                {videoInfo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Plateforme: {videoInfo.platform}
              </Typography>

              {videoInfo.description && (
                <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                  {videoInfo.description}
                </Typography>
              )}

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir sur {videoInfo.platform}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FullscreenIcon />}
                  onClick={handleFullscreen}
                >
                  Plein écran
                </Button>
              </Box>
            </Box>
          </Paper>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Vidéos similaires
            </Typography>
            <YouTubeRecommendedVideos category={videoInfo.category} limit={3} />
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ExternalVideoPlayer;
