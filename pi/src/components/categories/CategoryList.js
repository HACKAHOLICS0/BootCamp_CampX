import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CategoryStyle.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/categories');
        setCategories(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch categories');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="categories-container">
      <h2>Available Categories</h2>
      <div className="categories-grid">
        {categories.map((category) => (
          <Link 
            to={`/categories/${category._id}/modules`} 
            key={category._id} 
            className="category-card"
          >
            <div className="category-icon">
              <img src={category.icon || '/default-category-icon.png'} alt={category.name} />
            </div>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
