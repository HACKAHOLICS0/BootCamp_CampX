import React, { useState } from "react";
import axios from "axios";

const UploadVideo = () => {
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState(null);
  const [quiz, setQuiz] = useState([]);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("video", video);
    formData.append("quiz", JSON.stringify(quiz));

    await axios.post("https://ikramsegni.fr/api/videos/upload", formData);
    alert("Vidéo uploadée !");
  };

  return (
    <div>
      <h2>Uploader une vidéo</h2>
      <input type="text" placeholder="Titre" onChange={(e) => setTitle(e.target.value)} />
      <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])} />
      <button onClick={handleUpload}>Envoyer</button>
    </div>
  );
};

export default UploadVideo;
