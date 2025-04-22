import React, { useState } from 'react';
import { Container, Box, Typography, Button, Paper, Divider, Tabs, Tab, CircularProgress } from '@mui/material';
import { FaExclamationTriangle, FaExternalLinkAlt, FaArrowLeft, FaPlay, FaInfo, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const VideoUnavailable = ({ videoInfo, originalUrl }) => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenInNewTab = () => {
    setIsLoading(true);
    // Simuler un délai pour montrer le chargement
    setTimeout(() => {
      window.open(originalUrl, '_blank');
      setIsLoading(false);
    }, 500);
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ 
          bgcolor: '#f5f5f5', 
          p: 3, 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <FaLock size={24} color="#f44336" />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'medium' }}>
            Contenu protégé de {videoInfo.platform}
          </Typography>
        </Box>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<FaPlay />} label="REGARDER" />
          <Tab icon={<FaInfo />} label="INFORMATIONS" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 ? (
            <Box>
              <Typography variant="body1" paragraph>
                Cette vidéo de <strong>{videoInfo.platform}</strong> ne peut pas être intégrée directement dans notre plateforme en raison des restrictions de sécurité imposées par le fournisseur.
              </Typography>
              
              <Typography variant="body1" paragraph>
                Pour regarder cette vidéo, vous pouvez l'ouvrir directement sur {videoInfo.platform} en cliquant sur le bouton ci-dessous. Vous pourrez ensuite revenir à notre plateforme pour continuer votre apprentissage.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <FaExternalLinkAlt />}
                  onClick={handleOpenInNewTab}
                  disabled={isLoading}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {isLoading ? 'Ouverture...' : `Ouvrir sur ${videoInfo.platform}`}
                </Button>
              </Box>

              <Box sx={{ 
                bgcolor: '#f9f9f9', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid #e0e0e0',
                mt: 3
              }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Astuce :</strong> Vous pouvez garder notre plateforme ouverte dans un onglet pendant que vous regardez la vidéo dans un autre onglet. Cela vous permettra de revenir facilement pour continuer votre apprentissage.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Pourquoi ce contenu n'est-il pas intégré ?
              </Typography>
              
              <Typography variant="body2" paragraph>
                Les plateformes comme {videoInfo.platform} utilisent des mesures de sécurité qui empêchent l'intégration de leurs vidéos sur des sites tiers. Ces mesures incluent :
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" paragraph>
                  <strong>X-Frame-Options :</strong> Un en-tête HTTP qui empêche l'affichage du contenu dans des iframes sur d'autres domaines.
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Content-Security-Policy :</strong> Des règles qui contrôlent d'où le contenu peut être chargé.
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Protection contre le clickjacking :</strong> Des mesures qui empêchent les sites tiers de capturer les interactions des utilisateurs.
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph>
                Ces mesures sont mises en place pour protéger à la fois le contenu de {videoInfo.platform} et vos informations personnelles lorsque vous interagissez avec leur plateforme.
              </Typography>
              
              <Typography variant="body2">
                Nous travaillons continuellement à améliorer notre plateforme pour offrir une meilleure expérience d'apprentissage intégrée, tout en respectant les mesures de sécurité des fournisseurs de contenu.
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            startIcon={<FaArrowLeft />}
            onClick={handleBack}
            variant="outlined"
            size="small"
          >
            Retour
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Titre : {videoInfo.title}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default VideoUnavailable;
