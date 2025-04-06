import React, { useRef, useState, useEffect } from "react";

const VideoPlayer = ({ videoUrl, quiz }) => {
  const videoRef = useRef(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !quiz) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;

      // Vérifier si une question doit apparaître
      const questionToShow = quiz.find((q) => q.time <= currentTime && !q.asked);

      if (questionToShow) {
        video.pause();
        setCurrentQuestion(questionToShow);
        setIsPaused(true);
        questionToShow.asked = true; // Marquer la question comme posée
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [quiz]);

  const handleAnswer = () => {
    setCurrentQuestion(null);
    setIsPaused(false);
    videoRef.current.play();
  };

  return (
    <div>
      <video ref={videoRef} controls width="500">
        <source src={`http://localhost:5000${videoUrl}`} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture des vidéos.
      </video>

      {isPaused && currentQuestion && (
        <div className="quiz-overlay">
          <h3>{currentQuestion.question}</h3>
          {currentQuestion.answers.map((answer, index) => (
            <button key={index} onClick={handleAnswer}>
              {answer}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
