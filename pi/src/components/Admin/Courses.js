import React, { useEffect, useState } from "react";
import { courseAPI, moduleAPI } from "../../services/api";
import "./styles/AdminPointsStyle.css";
import "./styles/AdminTableStyle.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    module: "",
    content: "",
    price: "",
    duration: ""
  });

  // Fetch courses and modules
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Tentative de récupération des cours et modules...");
        const [coursesResponse, modulesResponse] = await Promise.all([
          courseAPI.getAll(),
          moduleAPI.getAll()
        ]);

        console.log("Réponse des cours:", coursesResponse);
        console.log("Modules récupérés:", modulesResponse.data);

        if (coursesResponse && coursesResponse.data) {
          console.log("Nombre de cours récupérés:", coursesResponse.data.length);
          setCourses(coursesResponse.data);
        } else {
          console.error("Aucune donnée de cours reçue ou format incorrect");
          setError("Aucune donnée de cours reçue");
        }

        setModules(modulesResponse.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle adding new course
  const handleAdd = () => {
    setIsAdding(true);
    setIsModalOpen(true);
    setFormData({
      title: "",
      description: "",
      module: "",
      content: "",
      price: "",
      duration: ""
    });
  };

  // Handle modifying course
  const handleModify = (courseId) => {
    const courseToModify = courses.find((course) => course._id === courseId);
    setSelectedCourse(courseToModify);
    setFormData({
      title: courseToModify.title,
      description: courseToModify.description,
      module: courseToModify.module._id,
      content: courseToModify.content,
      price: courseToModify.price,
      duration: courseToModify.duration
    });
    setIsAdding(false);
    setIsModalOpen(true);
  };

  // Handle archiving course
  const handleArchive = async (courseId) => {
    if (!window.confirm("Are you sure you want to archive this course?")) {
      return;
    }

    try {
      const response = await courseAPI.archive(courseId);
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course._id === courseId ? response.data : course
        )
      );
    } catch (error) {
      alert("Error archiving course: " + error.message);
    }
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

  // Add new course
  const handleAddCourse = async () => {
    if (!formData.title || !formData.description || !formData.module || !formData.price || !formData.duration) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const response = await courseAPI.create(formData);
      setCourses([...courses, response.data]);
      setIsModalOpen(false);
    } catch (error) {
      alert("Error adding course: " + error.message);
    }
  };

  // Update course
  const handleUpdateCourse = async () => {
    if (!formData.title || !formData.description || !formData.module || !formData.price || !formData.duration || !selectedCourse) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const response = await courseAPI.update(selectedCourse._id, formData);
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course._id === selectedCourse._id ? response.data : course
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      alert("Error updating course: " + error.message);
    }
  };

  return (
    <div className="content-section">
      <h2>Course Management</h2>

      {loading ? (
        <p className="loading-message">Loading courses...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div>
          <button className="action-btn add" onClick={handleAdd}>Add Course</button>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Module</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course._id} className={course.isArchived ? 'archived' : ''}>
                    <td>{course.title}</td>
                    <td>{course.module?.title}</td>
                    <td>${course.price}</td>
                    <td>{course.duration} hours</td>
                    <td>
                      <span className={`status-badge ${course.isArchived ? 'status-archived' : 'status-active'}`}>
                        {course.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="action-buttons">
                      {!course.isArchived && (
                        <>
                          <button
                            className="action-btn modify"
                            onClick={() => handleModify(course._id)}
                          >
                            Update
                          </button>
                          <button
                            className="action-btn archive"
                            onClick={() => handleArchive(course._id)}
                          >
                            Archive
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan="6">No courses found</td>
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
            <h3>{isAdding ? "Add New Course" : "Update Course"}</h3>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter course title"
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter course description"
                required
              />
            </div>
            <div className="form-group">
              <label>Module:</label>
              <select
                name="module"
                value={formData.module}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a module</option>
                {modules.map(module => (
                  <option key={module._id} value={module._id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Content:</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter course content"
                required
                rows="6"
              />
            </div>
            <div className="form-group">
              <label>Price ($):</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Enter course price"
                required
              />
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
            <div className="modal-actions">
              <button
                className="action-btn cancel"
                onClick={handleModalClose}
              >
                Cancel
              </button>
              <button
                className="action-btn submit"
                onClick={isAdding ? handleAddCourse : handleUpdateCourse}
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

export default Courses;
