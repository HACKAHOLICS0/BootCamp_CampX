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
  Chip,
  Rating,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import YouTubeIcon from '@mui/icons-material/YouTube';

const YouTubeRecommendedVideos = ({ category, limit = 6 }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interestPoints, setInterestPoints] = useState([]);

  useEffect(() => {
    const fetchRecommendedVideos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Créer une instance axios avec le token d'authentification
        const axiosInstance = axios.create({
          baseURL: 'http://51.91.251.228:5000/api',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('token')}`
          }
        });

        let response;

        // Si une catégorie est spécifiée et non vide, récupérer les vidéos YouTube pour cette catégorie
        if (category && category.trim() !== '') {
          response = await axiosInstance.get(`/youtube/category/${encodeURIComponent(category)}?limit=${limit}`);
        } else {
          // Sinon, récupérer les recommandations basées sur les points d'intérêt de l'utilisateur
          response = await axiosInstance.get(`/youtube/recommendations?limit=${limit}`);
        }

        if (response.data.success) {
          // Utiliser directement les vidéos YouTube retournées par l'API
          const youtubeVideos = response.data.videos || [];

          // Transformer les vidéos pour l'affichage
          const formattedVideos = youtubeVideos.map(video => ({
            title: video.title,
            platform: 'YouTube',
            thumbnailUrl: video.thumbnail,
            videoUrl: video.videoUrl,
            isDirectVideo: true,
            channel: video.channel,
            duration: video.duration,
            level: 'Tous niveaux'
          }));

          setVideos(formattedVideos);

          // Stocker les points d'intérêt utilisés pour les recommandations (si disponibles)
          if (response.data.interestPoints && response.data.interestPoints.length > 0) {
            setInterestPoints(response.data.interestPoints);
            console.log('Recommandations basées sur vos points d\'intérêt:', response.data.interestPoints.join(', '));
          }
        } else {
          setError('Aucune vidéo YouTube trouvée');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des vidéos YouTube recommandées:', error);
        setError('Erreur lors de la récupération des vidéos recommandées');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedVideos();
  }, [category, limit]);

  return (
    <Container sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <YouTubeIcon sx={{ color: 'red', fontSize: 32, mr: 1 }} />
        <Typography variant="h4" component="h2">
          Vidéos recommandées {category ? `sur ${category}` : ''}
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Découvrez ces vidéos YouTube sélectionnées pour vous selon vos centres d'intérêt.
      </Typography>

      {interestPoints.length > 0 && !category && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Basé sur vos points d'intérêt:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {interestPoints.map((point, index) => (
              <Chip
                key={index}
                label={point}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="info" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : videos.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          Aucune vidéo YouTube trouvée. Essayez une autre catégorie ou connectez-vous pour des recommandations personnalisées.
        </Alert>
      ) : (
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
                    image={video.thumbnailUrl}
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
                      href={`/external-video?url=${encodeURIComponent(video.videoUrl)}`}
                    >
                      <PlayArrowIcon fontSize="large" />
                    </IconButton>
                  </Box>

                  {/* Badge YouTube */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 0, 0, 0.8)',
                      color: 'white',
                      borderRadius: '4px',
                      px: 1,
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <YouTubeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    YouTube
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom noWrap title={video.title}>
                    {video.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {video.channel}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Durée: {video.duration}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Niveau: {video.level}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlayArrowIcon />}
                    component="a"
                    href={`/external-video?url=${encodeURIComponent(video.videoUrl)}`}
                    sx={{ bgcolor: '#FF0000', '&:hover': { bgcolor: '#CC0000' } }}
                  >
                    Regarder sur notre plateforme
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default YouTubeRecommendedVideos;
