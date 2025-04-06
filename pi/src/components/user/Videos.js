import React, { useEffect, useState } from "react";
import { getVideos } from "../../services/VideoService";  // Assure-toi que ce service existe et est bien configuré
import VideoPlayer from "./VideoPlayer";  // Assure-toi d'avoir créé ce composant

const Videos = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const data = await getVideos();
      setVideos(data);
    };

    fetchVideos();
  }, []);

  return (
    <div>
      <h2>Vidéos Interactives</h2>
      <div>
        {videos.length > 0 ? (
          videos.map((video) => (
            <div key={video._id}>
              <h3>{video.title}</h3>
              <VideoPlayer videoUrl={video.videoUrl} quiz={video.quiz} />
            </div>
          ))
        ) : (
          <p>Aucune vidéo disponible.</p>
        )}
      </div>
    </div>
  );
};

export default Videos;
