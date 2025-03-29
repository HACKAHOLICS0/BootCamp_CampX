import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const InteractiveVideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <Box sx={{ 
        width: '100%',
        position: 'relative',
        paddingTop: '56.25%', // Ratio 16:9
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <Typography>Vidéo non disponible</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      position: 'relative',
      paddingTop: '56.25%', // Ratio 16:9
      backgroundColor: '#000',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <video
        ref={videoRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        src={videoUrl}
        controls
        controlsList="nodownload"
        playsInline
        preload="auto"
      />
    </Box>
  );
};

export default InteractiveVideoPlayer; 