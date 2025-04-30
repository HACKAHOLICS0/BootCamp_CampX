import React, { useEffect, useState } from "react";
import "./AdminStyle.css";

const Users = () => {
  const [users, setUsers] = useState([]); // Stores fetched users
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/users"); // Adjust if needed
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
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
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
    if (user.googleId || user.authProvider === "github") {
      return user.image;
    }
    return user.image ? `http://localhost:5000/${user.image.replace(/\\/g, "/")}` : "/uploads/avatar7.png";
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
              <th>Status</th> {/* Ajout de la colonne pour le progrès */}
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
                  {/* Affichage du progrès pour chaque utilisateur */}
                  <ul>
                    {user.refmodules.map((moduleId) => (
                      <li key={moduleId}>
                        <span>Module: {moduleId}</span>
                        <span>Progression: {user.progress[moduleId]?.completionPercentage}%</span>
                      </li>
                    ))}
                  </ul>
                </td>
                  <td>

                    <button className="action-btn delete" onClick={() => handleDelete(user._id)}>Delete</button>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Users;
