import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import './ModuleStyle.css';

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { categoryId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        const [moduleRes, categoryRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/modules/category/${categoryId}`, config),
          axios.get(`http://localhost:5001/api/categories/${categoryId}`, config)
        ]);

        if (moduleRes.data && categoryRes.data) {
          setModules(moduleRes.data);
          setCategory(categoryRes.data);
        } else {
          setError('No data found');
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError(error.response?.data?.message || 'Failed to load modules. Please try again later.');
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  if (loading) {
    return (
      <div className="module-list-container">
        <div className="loading">Loading modules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module-list-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="module-list-container">
      <div className="module-header">
        <h2>{category ? category.name : 'Modules'}</h2>
        <p>
          {category?.description || 'Explore our collection of interactive learning modules'}
        </p>
      </div>
      
      {modules.length === 0 ? (
        <div className="no-modules">
          <p>No modules available for this category yet.</p>
          <p>Check back soon for new content!</p>
        </div>
      ) : (
        <div className="module-grid">
          {modules.map(module => (
            <div key={module._id} className="module-card">
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <div className="module-stats">
                <span>{module.coursesCount || 0} courses</span>
                <span>{module.duration || '0h'} total duration</span>
              </div>
              <Link 
                to={`/modules/${module._id}/courses`}
                className="btn btn-primary"
              >
                Explore Courses
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleList;
