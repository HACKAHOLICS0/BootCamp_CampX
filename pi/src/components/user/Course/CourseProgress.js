import React from 'react';
import { ProgressBar } from 'react-bootstrap';
import './CourseProgress.css';

const CourseProgress = ({ completedQuizzes, totalQuizzes }) => {
  const progress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;

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
        now={progress} 
        label={`${Math.round(progress)}%`}
        variant={progress === 100 ? "success" : "primary"}
      />
    </div>
  );
};

export default CourseProgress; 