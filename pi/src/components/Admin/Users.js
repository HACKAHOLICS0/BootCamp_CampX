import React, { useEffect, useState } from "react";
import "./AdminStyle.css";

const Users = () => {
  const [users, setUsers] = useState([]); // Stores fetched users
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  
  const API_BASE_URL = "http://51.91.251.228:5000"; // URL de base pour l'API

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data); // Update state with users
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setUsers(users.filter((user) => user._id !== id)); // Remove user from state
      alert("User deleted successfully!");
    } catch (error) {
      alert("Error deleting user: " + error.message);
    }
  };

  const getImageUrl = (user) => {
    // Si l'utilisateur n'existe pas ou n'a pas d'image
    if (!user || !user.image) {
      return "/uploads/avatar7.png";
    }
    
    // Si l'utilisateur utilise Google ou GitHub
    if (user.googleId || user.authProvider === "github" || user.authProvider === "google") {
      return user.image; // Retourner directement l'URL de l'image
    }
    
    // Si l'image est déjà une URL complète
    if (user.image.startsWith("http")) {
      return user.image;
    }
    
    // Si l'image contient le chemin complet du serveur
    if (user.image.includes('/home/ubuntu/camp-final/campx_finale/piBack/')) {
      // Extraire la partie relative du chemin (après 'piBack/')
      const relativePath = user.image.split('piBack/')[1];
      return `${API_BASE_URL}/${relativePath.replace(/\\/g, "/")}`;
    }
    
    // Cas standard: ajouter l'URL de base à l'image
    return `${API_BASE_URL}/${user.image.replace(/\\/g, "/")}`;
  };

  return (
    <div className="content-section">
      <h2>User Management</h2>

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Enrolled Courses</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <img
                      src={getImageUrl(user)}
                      alt="User"
                      className="user-avatar"
                      onError={(e) => {
                        e.target.onerror = null; // Éviter les boucles infinies
                        e.target.src = "/uploads/avatar7.png"; // Image par défaut en cas d'erreur
                      }}
                    />
                  </td>
                  <td>{user.name} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "N/A"}</td>
                  <td>
                    {user.enrolledCourses?.length > 0
                      ? (
                        <ul className="enrolled-courses-list">
                          {user.enrolledCourses.map((enrollment) => (
                            <li key={enrollment._id}>
                              <div className="course-title">{enrollment.courseId?.title || 'Unknown Course'}</div>
                              <div className="course-progress">Progress: {enrollment.progress || 0}%</div>
                            </li>
                          ))}
                        </ul>
                      )
                      : "No courses"}
                  </td>
                  <td>
                    {user.refmodules && user.refmodules.length > 0 ? (
                      <ul>
                        {user.refmodules.map((moduleId) => (
                          <li key={moduleId}>
                            <span>Module: {moduleId}</span>
                            <span>Progression: {user.progress && user.progress[moduleId]?.completionPercentage || 0}%</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No modules"
                    )}
                  </td>
                  <td>
                    <button className="action-btn delete" onClick={() => handleDelete(user._id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Users;
