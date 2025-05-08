import React, { useEffect, useState } from "react";
import { categoryAPI } from "../../services/api";
import "./styles/AdminPointsStyle.css";
import "./styles/AdminTableStyle.css";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: ""
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getAll();
        setCategories(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle adding new category
  const handleAdd = () => {
    setIsAdding(true);
    setIsModalOpen(true);
    setFormData({
      name: "",
      description: "",
      image: ""
    });
  };

  // Handle modifying category
  const handleModify = (categoryId) => {
    const categoryToModify = categories.find((cat) => cat._id === categoryId);
    setSelectedCategory(categoryToModify);
    setFormData({
      name: categoryToModify.name,
      description: categoryToModify.description,
      image: categoryToModify.image || ""
    });
    setIsAdding(false);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!formData.name || !formData.description) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const response = await categoryAPI.create(formData);
      setCategories([...categories, response.data]);
      setIsModalOpen(false);
    } catch (error) {
      alert("Error adding category: " + error.message);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!formData.name || !formData.description || !selectedCategory) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const response = await categoryAPI.update(selectedCategory._id, formData);
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat._id === selectedCategory._id ? response.data : cat
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      alert("Error updating category: " + error.message);
    }
  };

  // Delete category
  const handleDelete = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await categoryAPI.delete(categoryId);
      setCategories(prevCategories =>
        prevCategories.filter(cat => cat._id !== categoryId)
      );
    } catch (error) {
      alert("Error deleting category: " + error.message);
    }
  };

  return (
    <div className="content-section">
      <h2>Category Management</h2>

      {loading ? (
        <p className="loading-message">Loading categories...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div>
          <button className="action-btn add" onClick={handleAdd}>Add Category</button>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>{category.description}</td>
                    <td className="action-buttons">
                      <button
                        className="action-btn modify"
                        onClick={() => handleModify(category._id)}
                      >
                        Update
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(category._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan="3">No categories found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Update Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isAdding ? "Add New Category" : "Update Category"}</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter category name"
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter category description"
                required
              />
            </div>
            <div className="form-group">
              <label>Image URL:</label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="Enter image URL (optional)"
              />
            </div>
            <div className="modal-actions">
              <button
                className="action-btn cancel"
                onClick={handleModalClose}
              >
                Cancel
              </button>
              <button
                className="action-btn submit"
                onClick={isAdding ? handleAddCategory : handleUpdateCategory}
              >
                {isAdding ? "Add" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
