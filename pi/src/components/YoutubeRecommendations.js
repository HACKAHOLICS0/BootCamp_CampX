import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Cookies from 'js-cookie';

const YoutubeRecommendations = ({ limit = 6 }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create axios instance with default config
  const axiosInstance = axios.create({
    baseURL: 'https://ikramsegni.fr/api',
    withCredentials: true
  });

  // Add request interceptor to add token to every request
  axiosInstance.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    const fetchYoutubeRecommendations = async () => {
      try {
        setLoading(true);
        
        // Récupérer les recommandations YouTube basées sur les points d'intérêt de l'utilisateur
        const response = await axiosInstance.get('/youtube/recommendations');
        
        if (response.data.success) {
          // Limiter le nombre de vidéos à afficher
          const limitedVideos = response.data.videos.slice(0, limit);
          setVideos(limitedVideos);
        } else {
          setError('Impossible de récupérer les vidéos recommandées');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des recommandations YouTube:', error);
        setError('Erreur lors de la récupération des recommandations YouTube');
      } finally {
        setLoading(false);
      }
    };

    fetchYoutubeRecommendations();
  }, [limit]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (videos.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Aucune vidéo recommandée trouvée. Ajoutez des points d'intérêt à votre profil pour obtenir des recommandations.
      </Alert>
    );
  }

  return (
    <Container sx={{ my: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Vidéos recommandées basées sur vos points d'intérêt
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Découvrez ces vidéos YouTube sélectionnées pour vous selon vos centres d'intérêt.
      </Typography>

      <Grid container spacing={3}>
        {videos.map((video, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}>
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={video.thumbnail}
                  alt={video.title}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                >
                  <IconButton
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                    }}
                    component="a"
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PlayArrowIcon fontSize="large" />
                  </IconButton>
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3" gutterBottom noWrap title={video.title}>
                  {video.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {video.channel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Durée: {video.duration}
                </Typography>
              </CardContent>

              <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  component="a"
                  href={`/external-video?url=${encodeURIComponent(video.videoUrl)}`}
                >
                  Regarder sur notre plateforme
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default YoutubeRecommendations;
