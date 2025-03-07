import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import './CourseStyle.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { moduleId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        console.log(`Tentative de récupération des cours pour le module ${moduleId}`);

        // Récupérer toutes les données nécessaires
        const [allCoursesRes, moduleRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/courses`, config),
          axios.get(`http://localhost:5000/api/modules/${moduleId}`, config)
        ]);

        // Récupérer le module
        if (moduleRes.data) {
          setModule(moduleRes.data);
          console.log('Module récupéré:', moduleRes.data);
        } else {
          setError('Module introuvable');
        }

        // Filtrer les cours côté client selon le moduleId
        if (allCoursesRes.data && allCoursesRes.data.length > 0) {
          console.log(`Total de ${allCoursesRes.data.length} cours récupérés`);
          
          const filteredCourses = allCoursesRes.data.filter(course => {
            // Vérifier toutes les façons possibles que le cours pourrait être associé au module
            const moduleMatch = course.module === moduleId || 
                               (course.module && course.module._id === moduleId) || 
                               course.moduleId === moduleId;
            
            console.log(`Cours ${course._id} - module: ${course.module}, moduleId: ${course.moduleId}, match: ${moduleMatch}`);
            
            return moduleMatch;
          });
          
          console.log(`${filteredCourses.length} cours filtrés pour le module ${moduleId}`);
          setCourses(filteredCourses);
        } else {
          console.log('Aucun cours disponible');
          setCourses([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError(error.response?.data?.error || 'Failed to load courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [moduleId]);

  if (loading) return <div className="loading">Chargement des cours...</div>;
  
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="course-list-container">
      {module && (
        <div className="module-header">
          <h2>{module.title}</h2>
          <p className="module-description">{module.description}</p>
        </div>
      )}

      {courses.length > 0 ? (
        <div className="course-grid">
          {courses.map(course => (
            <div key={course._id} className="course-card">
              <div className="course-card-content">
                <div className="course-info">
                  <h3>{course.title || "Sans titre"}</h3>
                  <p>{course.description || "Aucune description"}</p>
                </div>
                <div className="course-meta">
                  <div className="course-stats">
                    <span>
                      <i className="far fa-clock"></i>
                      {course.duration || '0h'} h
                    </span>
                    <span>
                      <i className="fas fa-dollar-sign"></i>
                      {course.price || '0'} €
                    </span>
                    <span>
                      <i className="fas fa-users"></i>
                      {course.purchasedBy?.length || 0} étudiants
                    </span>
                  </div>
                </div>
                <Link 
                  to={`/courses/${course._id}`}
                  className="btn btn-primary course-btn"
                >
                  Voir le cours
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-courses">
          <p>No courses available for this module yet.</p>
          <p>Check back soon for new content!</p>
        </div>
      )}
    </div>
  );
};

export default CourseList;
