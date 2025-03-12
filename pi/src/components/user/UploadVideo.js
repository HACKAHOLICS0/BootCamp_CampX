import React, { useState } from 'react';
import axios from 'axios';

const UploadVideo = () => {
  const [video, setVideo] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null); // Pour stocker l'URL de la vidéo après upload

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideo(file);
        setVideoName(file.name); // Afficher le nom de la vidéo
        setError(null); // Réinitialiser les erreurs si le fichier est valide
      } else {
        setError('Veuillez sélectionner un fichier vidéo valide.');
      }
    }
  };

  const handleUpload = async () => {
    if (!video) {
      setError('Veuillez sélectionner une vidéo.');
      return;
    }
    
    const formData = new FormData();
    formData.append('video', video);

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:5000/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200) {
        setVideoUrl(response.data.fileUrl); // Mettre à jour l'URL de la vidéo
        alert('Vidéo uploadée avec succès !');
      }
    } catch (err) {
      setError('Erreur lors de l\'upload de la vidéo.');
      console.error('Erreur lors de l\'upload:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Uploader une vidéo</h2>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
      />
      {videoName && <p>Vidéo sélectionnée : {videoName}</p>}
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Chargement...' : 'Uploader'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* Si la vidéo a été téléchargée avec succès, afficher l'URL de la vidéo */}
      {videoUrl && (
        <div>
          <h3>Vidéo téléchargée</h3>
          <video controls width="500">
            <source src={videoUrl} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture des vidéos.
          </video>
        </div>
      )}
    </div>
  );
};

export default UploadVideo;
