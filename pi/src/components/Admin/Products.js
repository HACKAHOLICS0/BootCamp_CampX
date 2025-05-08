import React from 'react';
import './AdminStyle.css'
const Products = () => (
  <div className="content-section">
    <h2>Product Management</h2>
    <div className="product-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="product-card">
          <img src={`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop`} alt="Product" />
          <div className="product-info">
            <h3>Product {i}</h3>
            <p>$299.99</p>
            <div className="product-actions">
              <button className="action-btn edit">Edit</button>
              <button className="action-btn delete">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Products;