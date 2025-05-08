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
  IconButton
} from '@mui/material';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const RecommendedVideos = ({ category, limit = 6 }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create axios instance with default config
  const axiosInstance = axios.create({
    baseURL: 'http://51.91.251.228:5000/api',
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
    const fetchRecommendedVideos = async () => {
      try {
        setLoading(true);

        // Si une catégorie est spécifiée, l'utiliser comme terme de recherche
        const searchTerm = category || 'programming';

        // Récupérer les dernières données de Market Insights pour cette catégorie
        const response = await axiosInstance.get(`/market-insights/search/${encodeURIComponent(searchTerm)}`);

        if (response.data.success) {
          // Extraire les cours des résultats
          const marketCourses = response.data.data.courses || [];

          // Transformer les cours en vidéos (en extrayant les URL de vidéos)
          const extractedVideos = [];

          // Pour chaque cours, créer une entrée de vidéo
          marketCourses.forEach(course => {
            // Vérifier si l'URL contient "lecture" (comme dans l'exemple Coursera)
            const isVideoLecture = course.url && (course.url.includes('lecture') || course.url.includes('video') || course.url.includes('watch'));

            // Créer un objet vidéo
            const videoObj = {
              title: course.title,
              platform: course.platform,
              thumbnailUrl: getDefaultImageForPlatform(course.platform),
              videoUrl: course.url,
              isDirectVideo: isVideoLecture,
              price: formatPrice(course.price),
              rating: course.rating,
              instructor: course.instructor || 'Instructeur non spécifié',
              duration: course.duration || '10-15 min',
              level: course.level || 'Tous niveaux'
            };

            extractedVideos.push(videoObj);
          });

          // Limiter le nombre de vidéos à afficher
          const limitedVideos = extractedVideos.slice(0, limit);

          setVideos(limitedVideos);
        } else {
          setError('Impossible de récupérer les vidéos recommandées');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des vidéos recommandées:', error);
        setError('Erreur lors de la récupération des vidéos recommandées');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedVideos();
  }, [category, limit]);

  // Fonction pour obtenir une image par défaut selon la plateforme
  const getDefaultImageForPlatform = (platform) => {
    const images = {
      'Udemy': 'https://img-c.udemycdn.com/course/480x270/default.jpg',
      'Coursera': 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/default.jpg',
      'edX': 'https://prod-discovery.edx-cdn.org/media/course/image/default.jpg',
      'YouTube': 'https://i.ytimg.com/vi/default/hqdefault.jpg',
      'Khan Academy': 'https://cdn.kastatic.org/images/khan-logo-vertical-transparent.png',
      'MIT OpenCourseWare': 'https://ocw.mit.edu/images/ocw_mast.jpg'
    };

    return images[platform] || 'https://via.placeholder.com/300x200?text=Video+Lecture';
  };

  // Fonction pour formater le prix
  const formatPrice = (price) => {
    if (!price) return 'Gratuit';
    if (typeof price === 'number') {
      return `${price.toFixed(2)} €`;
    }
    return price;
  };

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
        Aucune vidéo recommandée trouvée pour cette catégorie.
      </Alert>
    );
  }

  return (
    <Container sx={{ my: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Vidéos recommandées {category ? `sur ${category}` : ''}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Découvrez ces vidéos de cours sélectionnées pour vous depuis les meilleures plateformes d'apprentissage.
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
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PlayArrowIcon fontSize="large" />
                  </IconButton>
                </Box>
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip
                    label={video.platform}
                    size="small"
                    color={video.platform === 'Udemy' ? 'primary' : video.platform === 'Coursera' ? 'secondary' : 'default'}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {video.price}
                  </Typography>
                </Box>

                <Typography variant="h6" component="h3" gutterBottom noWrap title={video.title}>
                  {video.title}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {video.instructor}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {video.duration}
                  </Typography>
                </Box>

                {video.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={parseFloat(video.rating)} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {video.rating}
                    </Typography>
                  </Box>
                )}

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
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Regarder
                </Button>

                {video.isDirectVideo && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    component="a"
                    href={`/external-video?url=${encodeURIComponent(video.videoUrl)}`}
                    sx={{ minWidth: 'auto' }}
                    title="Regarder sur notre plateforme"
                  >
                    <OpenInNewIcon />
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default RecommendedVideos;
