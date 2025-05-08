import React, { useEffect, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import './CourseProgress.css';

const CourseProgress = ({ completedQuizzes, totalQuizzes }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const progress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;

  useEffect(() => {
    // Animation de la barre de progression
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="course-progress">
      <div className="progress-info">
        <span className="progress-text">
          {completedQuizzes} sur {totalQuizzes} quiz terminés
        </span>
        <span className="progress-percentage">
          {Math.round(progress)}%
        </span>
      </div>
      <ProgressBar
        now={animatedProgress}
        variant={progress === 100 ? "success" : "primary"}
        striped={progress === 100}
        animated={progress === 100}
      />
    </div>
  );
};

export default CourseProgress;