import React, { useEffect, useState } from "react";
import { moduleAPI, categoryAPI } from "../../services/api";
import "./styles/AdminPointsStyle.css";
import "./styles/AdminTableStyle.css";

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    difficulty: "intermediate",
    image: ""
  });

  // Fetch modules and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesResponse, categoriesResponse] = await Promise.all([
          moduleAPI.getAll(),
          categoryAPI.getAll()
        ]);

        setModules(modulesResponse.data);
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle adding new module
  const handleAdd = () => {
    setIsAdding(true);
    setIsModalOpen(true);
    setFormData({
      title: "",
      description: "",
      category: "",
      duration: "",
      difficulty: "intermediate",
      image: ""
    });
  };

  // Handle modifying module
  const handleModify = (moduleId) => {
    const moduleToModify = modules.find((mod) => mod._id === moduleId);
    setSelectedModule(moduleToModify);
    setFormData({
      title: moduleToModify.title,
      description: moduleToModify.description,
      category: moduleToModify.category._id,
      duration: moduleToModify.duration,
      difficulty: moduleToModify.difficulty,
      image: moduleToModify.image || ""
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

  // Add new module
  const handleAddModule = async () => {
    if (!formData.title || !formData.description || !formData.category || !formData.duration) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const response = await moduleAPI.create(formData);
      setModules([...modules, response.data]);
      setIsModalOpen(false);
    } catch (error) {
      alert("Error adding module: " + error.message);
    }
  };

  // Update module
  const handleUpdateModule = async () => {
    if (!formData.title || !formData.description || !formData.category || !formData.duration || !selectedModule) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const response = await moduleAPI.update(selectedModule._id, formData);
      setModules(prevModules =>
        prevModules.map(mod =>
          mod._id === selectedModule._id ? response.data : mod
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      alert("Error updating module: " + error.message);
    }
  };

  // Delete module
  const handleDelete = async (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module?")) {
      return;
    }

    try {
      await moduleAPI.delete(moduleId);
      setModules(prevModules =>
        prevModules.filter(mod => mod._id !== moduleId)
      );
    } catch (error) {
      alert("Error deleting module: " + error.message);
    }
  };

  return (
    <div className="content-section">
      <h2>Module Management</h2>

      {loading ? (
        <p className="loading-message">Loading modules...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div>
          <button className="action-btn add" onClick={handleAdd}>Add Module</button>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.length > 0 ? (
                modules.map((module) => (
                  <tr key={module._id}>
                    <td>{module.title}</td>
                    <td>{module.category?.name}</td>
                    <td>{module.duration} hours</td>
                    <td>
                      <span className={`status-badge ${
                        module.difficulty === 'beginner' ? 'status-active' :
                        module.difficulty === 'advanced' ? 'status-archived' : 'status-inactive'
                      }`}>
                        {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button
                        className="action-btn modify"
                        onClick={() => handleModify(module._id)}
                      >
                        Update
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(module._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan="5">No modules found</td>
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
            <h3>{isAdding ? "Add New Module" : "Update Module"}</h3>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter module title"
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter module description"
                required
              />
            </div>
            <div className="form-group">
              <label>Category:</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Duration (hours):</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Enter duration in hours"
                required
              />
            </div>
            <div className="form-group">
              <label>Difficulty:</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
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
                onClick={isAdding ? handleAddModule : handleUpdateModule}
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

export default Modules;
