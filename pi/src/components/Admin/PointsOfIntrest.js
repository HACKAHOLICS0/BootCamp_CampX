import React, { useEffect, useState } from "react";
import "./styles/AdminPointsStyle.css";

const backendURL = "http://localhost:5000"; // URL de base pour l'API

const InterestPoints = () => {
  const [pointsOfInterest, setPointsOfInterest] = useState([]); // Liste des points d'intérêt
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState(null); // État d'erreur
  const [selectedPoint, setSelectedPoint] = useState(null); // Point sélectionné pour modification
  const [newPointValue, setNewPointValue] = useState(""); // Valeur du nouveau point d'intérêt
  const [isModalOpen, setIsModalOpen] = useState(false); // Contrôle l'ouverture de la modale
  const [isAdding, setIsAdding] = useState(false); // Contrôle si c'est un ajout ou une mise à jour

  // Récupérer les points d'intérêt
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await fetch(`${backendURL}/api/interest-points-admin`); // API pour récupérer les points
        if (!response.ok) {
          throw new Error("Failed to fetch interest points");
        }
        const data = await response.json();
        setPointsOfInterest(data); // Mettre à jour l'état avec les points d'intérêt
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, []);

  // Gérer l'ajout d'un nouveau point d'intérêt
  const handleAdd = () => {
    setIsAdding(true); // Définir l'état pour l'ajout
    setIsModalOpen(true); // Ouvrir la modale
    setNewPointValue(""); // Réinitialiser la valeur
  };

  // Gérer la modification des points d'intérêt
  const handleModify = (pointId) => {
    const pointToModify = pointsOfInterest.find((point) => point._id === pointId);
    setSelectedPoint(pointToModify);
    setNewPointValue(pointToModify.value); // Pré-remplir la valeur dans la modale
    setIsAdding(false); // Définir l'état pour la mise à jour
    setIsModalOpen(true); // Ouvrir la modale de mise à jour
  };

  // Gérer la fermeture de la modale
  const handleModalClose = () => {
    setIsModalOpen(false); // Fermer la modale
  };
// Ajoutez la fonction handleToggleActivation avant le return() dans votre composant
const handleToggleActivation = async (id, isActive) => {
    try {
      const response = await fetch(`${backendURL}/api/interest-point/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }), // Alterne l'état d'activation
      });
  
      if (!response.ok) {
        throw new Error("Failed to update point activation");
      }
  
      const updatedPoints = pointsOfInterest.map((point) =>
        point._id === id ? { ...point, isActive: !isActive } : point
      );
      setPointsOfInterest(updatedPoints); // Mettre à jour l'état avec les points modifiés
      alert(`Point ${isActive ? "deactivated" : "activated"} successfully!`);
    } catch (error) {
      alert("Error toggling activation: " + error.message);
    }
  };
  
  
  // Ajouter un nouveau point d'intérêt
  const handleAddPoint = async () => {
    if (!newPointValue) {
      alert("Please enter a value for the new point!");
      return;
    }

    try {
      const response = await fetch(`${backendURL}/api/interest-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: newPointValue }), // Envoi de la valeur du nouveau point
      });

      if (!response.ok) {
        throw new Error("Failed to add new point");
      }

      const newPoint = await response.json();
      setPointsOfInterest([...pointsOfInterest, newPoint]); // Ajouter le nouveau point à la liste des points
      setIsModalOpen(false); // Fermer la modale après ajout
    } catch (error) {
      alert("Error adding point: " + error.message);
    }
  };

  const handleUpdatePoint = async () => {
    if (!newPointValue || !selectedPoint) {
      alert("Please enter a valid value for the point!");
      return;
    }
  
    try {
      const response = await fetch(`${backendURL}/api/api/interest-point/${selectedPoint._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: newPointValue }), // Mettre à jour la valeur du point
      });
  
      if (!response.ok) {
        throw new Error("Failed to update point");
      }
      console.log("newPointValue:", newPointValue); // Vérification de la réponse du serveur

      const updatedPoint = await response.json();
      console.log("Point mis à jour:", updatedPoint); // Vérification de la réponse du serveur
    
      // Mettre à jour l'état avec la nouvelle valeur du point modifié
      setPointsOfInterest((prevPoints) =>
        prevPoints.map((point) =>
          point._id === updatedPoint.point._id ? { ...point, value: updatedPoint.point.value } : point
        )
      );
  
      setIsModalOpen(false); // Fermer la modale après la mise à jour
    } catch (error) {
      alert("Error updating point: " + error.message);
    }
  };
  
  

  return (
    <div className="content-section">
      <h2>Interest Points Management</h2>

      {loading ? (
        <p>Loading points of interest...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
          <button className="action-btn add" onClick={handleAdd}>Add Point</button>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th> {/* Afficher la valeur du point */}
                <th>Status</th> {/* Afficher l'état du point (actif/inactif) */}
                <th>Actions</th> {/* Bouton pour l'activation/désactivation et mise à jour */}
              </tr>
            </thead>
            <tbody>
              {pointsOfInterest.length > 0 ? (
                pointsOfInterest.map((point) => (
                  <tr key={point._id}>
                    <td>{point.value}</td> {/* Affichage de la valeur du point */}
                    <td>
                      <button
                        className={`action-btn ${point.isActive ? "deactivate" : "activate"}`}
                        onClick={() => handleToggleActivation(point._id, point.isActive)}
                      >
                        {point.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                    <td>
                      <button className="action-btn modify" onClick={() => handleModify(point._id)}>Update</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No points found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale d'ajout ou de mise à jour */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isAdding ? "Add a New Point" : "Update Point"}</h3>
            <input
              type="text"
              placeholder="Enter point value"
              value={newPointValue}
              onChange={(e) => setNewPointValue(e.target.value)}
            />
            <button className="action-btn add" onClick={isAdding ? handleAddPoint : handleUpdatePoint}>
              {isAdding ? "Add Point" : "Update Point"}
            </button>
            <button className="action-btn cancel" onClick={handleModalClose}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestPoints;
