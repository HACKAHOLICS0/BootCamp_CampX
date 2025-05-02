import "../../assets/css/user.css";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import 'bootstrap-icons/font/bootstrap-icons.css';


const backendURL = "http://localhost:5000";
const getImageUrl = (user) => {
    // Vérifie si l'utilisateur ou son image est défini
    if (!user || !user.image) {
        return "/uploads/avatar7.png"; // Image par défaut
    }

    // Si l'image est déjà une URL complète (Google OAuth, GitHub, etc.)
    if (user.image.startsWith("http")) {
        return user.image; // Retourner directement l'URL de l'image de Google
    }

    // Sinon, utiliser l'image locale stockée sur le serveur
    return `${backendURL}/${user.image.replace(/\\/g, "/")}`;  // Assurez-vous que le chemin soit correctement formaté
};


export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInterestPointModalOpen, setIsInterestPointModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [pointToDelete, setPointToDelete] = useState(null);

    const [editableUser, setEditableUser] = useState({
        name: "", lastName: "", birthDate: "", email: "", phone: ""
    });
    const [interestPoints, setInterestPoints] = useState([]);
    const [selectedPoints, setSelectedPoints] = useState([]);

    useEffect(() => {
        // Vérifier d'abord dans localStorage
        const localStorageUser = localStorage.getItem("user");

        // Puis vérifier dans les cookies comme fallback
        const cookieUser = Cookies.get("user");

        // Utiliser localStorage en priorité
        const storedUser = localStorageUser || cookieUser;

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log("User data in profile:", parsedUser);
                console.log("User type in profile:", parsedUser.typeUser);
                setUser(parsedUser);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (user) {
            setEditableUser({
                name: user.name || "",
                lastName: user.lastName || "",
                birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
                email: user.email || "",
                phone: user.phone || ""
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchInterestPoints = async () => {
            try {
                // Corriger le chemin de l'API pour s'assurer qu'il correspond à la route backend
                const response = await fetch(`${backendURL}/api/interest-points`);
                const data = await response.json();
                console.log("Fetched interest points:", data); // Vérifie le format des données

                // Assurez-vous que les données récupérées sont correctement filtrées
                if (Array.isArray(data)) {
                    setInterestPoints(data);

                    if (user && user.interestPoints) {
                        const filteredPoints = data.filter(point => user.interestPoints.includes(point.value));
                        setSelectedPoints(filteredPoints.map(point => point.value));
                    }
                } else {
                    console.error("Les données récupérées ne sont pas un tableau:", data);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des points d'intérêt :", error);
            }
        };

        if (user) {
            fetchInterestPoints();
        }
    }, [user]);


    const handleEditUser = () => {
        setIsModalOpen(true);
    };

    const handleSaveUser = async () => {
        if (!user || !(user._id || user.id)) {
            console.log("No user or user ID found.");
            return;
        }

        const userId = user._id || user.id; // Extract and ensure we have a valid ID
        console.log("User ID passed as parameter:", userId); // Ajout du log pour afficher l'ID

        try {
            const response = await fetch(`${backendURL}/api/auth/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editableUser),
            });

            if (!response.ok) {
                throw new Error("Failed to update user data");
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });
            setEditableUser({
                name: updatedUser.name || "",
                lastName: updatedUser.lastName || "",
                birthDate: updatedUser.birthDate ? updatedUser.birthDate.split("T")[0] : "",
                email: updatedUser.email || "",
                phone: updatedUser.phone || ""
            });

            setIsModalOpen(false);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const closeInterestPointModal = () => {
        setIsInterestPointModalOpen(false);
    };

    const openInterestPointModal = () => {
        setIsInterestPointModalOpen(true);
    };

    const handlePointSelection = (point) => {
        const isSelected = selectedPoints.includes(point.value);
        if (isSelected) {
            setSelectedPoints(selectedPoints.filter(p => p !== point.value));
        } else {
            setSelectedPoints([...selectedPoints, point.value]);
        }
    };

    const handleSaveSelection = async () => {
        const storedUser = Cookies.get("user");

        if (!storedUser) {
            console.log("No stored user found in localStorage.");
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser._id || parsedUser.id;

        console.log("User ID passed as parameter:", userId);
        console.log("Selected points before saving:", selectedPoints);

        const updatedSelectedPoints = [...new Set([...user.refinterestpoints, ...selectedPoints])];

        try {
            const response = await fetch(`${backendURL}/api/user/${userId}/interest-points`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ selectedPoints: updatedSelectedPoints }),
            });

            if (!response.ok) {
                throw new Error("Échec de l'enregistrement des points d'intérêt");
            }

            const updatedUser = await response.json();
            console.log("Updated user from backend:", updatedUser);

            setUser(updatedUser);
            Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });
            setIsInterestPointModalOpen(false);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des points d'intérêt :", error);
        }
    };

    useEffect(() => {
        if (user && user.interestPoints) {
            setSelectedPoints(user.interestPoints);
        }
    }, [user]);

    const [errors, setErrors] = useState({
        name: "",
        lastName: "",
        birthDate: "",
        email: "",
        phone: ""
    });

    const [isFormValid, setIsFormValid] = useState(false);

    const validateField = (field) => {
        const newErrors = { ...errors };
        if (editableUser[field] === "") {
            newErrors[field] = `${field.replace(/([A-Z])/g, ' $1')} is required.`;
        } else {
            newErrors[field] = "";
        }

        if (field === "email" && editableUser[field] && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(editableUser[field])) {
            newErrors[field] = "Invalid email format.";
        }

        if (field === "phone" && editableUser[field] && !/^\+?[1-9]\d{1,14}$/.test(editableUser[field])) {
            newErrors[field] = "Invalid phone number format.";
        }

        if (field === "birthDate" && editableUser[field] && new Date(editableUser[field]) > new Date()) {
            newErrors[field] = "Birth date cannot be in the future.";
        }

        setErrors(newErrors);
        checkFormValidity(newErrors);
    };

    const checkFormValidity = (newErrors) => {
        setIsFormValid(!Object.values(newErrors).some(error => error !== '') && Object.values(editableUser).every(value => value !== ''));
    };
    const openDeleteModal = (point) => {
        console.log("Selected point for deletion:", point); // Vérifie ce qui est sélectionné
        setPointToDelete(point);  // Assure-toi d'utiliser `point.value`
        setIsDeleteModalOpen(true);
    };


    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setPointToDelete(null);
    };
    const deleteInterestPoint = async () => {
        console.log("Point to delete:", pointToDelete);  // Vérifie ce que contient pointToDelete

        const storedUser = Cookies.get("user");
        if (!storedUser) {
            console.log("No stored user found in localStorage.");
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser._id || parsedUser.id;

        try {
            const response = await fetch(`${backendURL}/api/user/${userId}/interest-point`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ point: pointToDelete })
            });

            if (!response.ok) {
                throw new Error("Failed to delete interest point");
            }

            // Mettre à jour les points d'intérêt de l'utilisateur
            const updatedUserInterestPoints = user.refinterestpoints.filter(point => point !== pointToDelete);

            // Mettez à jour les données de l'utilisateur pour refléter les points supprimés
            const updatedUser = {
                ...user,
                refinterestpoints: updatedUserInterestPoints
            };

            setUser(updatedUser);
            Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });

            // Mettre à jour l'état local des points d'intérêt
            setInterestPoints(updatedUserInterestPoints);  // Seuls les points de l'utilisateur

            // Fermer le modal après suppression
            closeDeleteModal();

        } catch (error) {
            console.error("Erreur lors de la suppression du point d'intérêt :", error);
        }
    };



    if (!user) {
        return (
            <div className="text-center mt-5">
                <h4>Loading user data...</h4>
            </div>
        );
    }
    return (
        <div id="main" data-aos="fade-in">
            <div className="container mt-5">
                <div className="main-body">
                    <div className="row">
                        <div className="col-md-4 mb-3 d-flex align-items-stretch">
                            <div className="card card-user w-100">
                                <div className="card-body-user text-center">
                                <img src={getImageUrl(user)} className="rounded-circle" width="200" alt="User Avatar" />
                                <div className="mt-3">
                                        <h4>{user.name || "User"}</h4>
                                        {(user.typeUser === 'admin' || user.role === 'admin') && (
                                            <div className="mt-2">
                                                <a href="/admin" className="btn btn-primary">
                                                    Admin Dashboard
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-8 mb-3 d-flex align-items-stretch">
                            <div className="card-user w-100">
                                <div className="card-body card-body-user">
                                    <h4 className="text-center my-3">Personal Information</h4>
                                    {["name", "lastName", "birthDate", "email", "phone"].map((key, index) => (
                                        <React.Fragment key={index}>
                                            <div className="row">
                                                <div className="col-sm-3">
                                                    <h6 className="mb-0">{key.replace(/([A-Z])/g, ' $1')}</h6>
                                                </div>
                                                <div className="col-sm-9 text-secondary">{user[key] || "N/A"}</div>
                                            </div>
                                            <hr />
                                        </React.Fragment>
                                    ))}
                                     <div className="text-end mt-3">
            <button className="edit-button" onClick={handleEditUser}>
                <i className="fa fa-edit"></i> {/* Icône d'édition */}

            </button>
        </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-8 offset-md-4 my-3 d-flex align-items-stretch">
                            <div className="card card-point w-100">
                                <h4 className="text-center my-3">Points of Interest</h4>
                                <hr />
                                <div className="row">
    {user.refinterestpoints && user.refinterestpoints.length > 0 ? (
        user.refinterestpoints.map((point, i) => (
            <div key={i} className="col-auto mb-2">
                <div
                    className="card point-card"
                    style={{
                        cursor: 'pointer',
                        maxWidth: '250px',
                        fontSize: '0.9rem',
                        padding: '10px',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                    }}
                    onClick={() => openDeleteModal(typeof point === 'string' ? point : point.value)} // Vérifie si point est une chaîne ou un objet
                >
                    <div className="card-body" style={{ padding: '10px' }}>
                        <h5>{typeof point === 'string' ? point : point.value}</h5> {/* Affiche correctement le nom du point */}
                    </div>
                </div>
            </div>
        ))
    ) : (
        <p>No points of interest available.</p>
    )}
</div>
<div className="text-end mt-3 me-3">
    <button className="edit-button" onClick={openInterestPointModal}>
        <i className="bi bi-plus"></i> {/* Icône + */}
    </button>
</div>

                            </div>
                        </div>
                    </div>
                </div>

                {isModalOpen && (
    <div className="edit-modal-overlay">
        <div className="edit-modal-content">
            <span className="edit-modal-close" onClick={closeModal}>&times;</span>
            <h4 className="edit-modal-title">Edit User Information</h4>
            <form className="edit-modal-form">
                {Object.keys(editableUser).map((key, index) => (
                    <div key={index} className="edit-form-group">
                        <label className="edit-form-label">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                            type={key === "birthDate" ? "date" : "text"}
                            className="edit-form-control"
                            value={editableUser[key]}
                            onChange={(e) => {
                                setEditableUser({ ...editableUser, [key]: e.target.value });
                                validateField(key);
                            }}
                        />
                        {errors[key] && <small className="text-danger">{errors[key]}</small>}
                    </div>
                ))}
                <div className="edit-modal-footer">
                    <button className="edit-save-button" onClick={handleSaveUser} disabled={!isFormValid}>
                        Save
                    </button>
                </div>
            </form>
        </div>
    </div>
)}


{isInterestPointModalOpen && (
    <div className="custom-modal-overlay">
        <div className="custom-modal-content">
            <span className="custom-close" onClick={closeInterestPointModal}>&times;</span>
            <h4>Select Points of Interest</h4>
            <div className="custom-interest-points-grid">
                {interestPoints.map((point, index) => (
                    <div
                        key={index}
                        className={`custom-card custom-point-card ${selectedPoints.includes(point.value) ? 'custom-selected' : ''}`}
                        onClick={() => handlePointSelection(point)}
                    >
                        <div className="custom-card-body custom-card-body-point">
                            <h5>{point.value}</h5>
                        </div>
                    </div>
                ))}
            </div>
            <div className="custom-text-end custom-mt-3">
                <button className="custom-save-button" onClick={handleSaveSelection}>
                    Save Selection
                </button>
            </div>
        </div>
    </div>
)}

{isDeleteModalOpen && (
    <div className="modal-overlay">
        <div className="modal-content delete-modal">
            <span className="close" onClick={closeDeleteModal}>&times;</span>
            <h4>Are you sure you want to delete this interest point?</h4>
            <div className="modal-footer">
                <button className="delete-button" onClick={deleteInterestPoint}>
                    Yes, Delete
                </button>
                <button className="cancel-button" onClick={closeDeleteModal}>
                    No, Keep
                </button>
            </div>
        </div>
    </div>
)}


            </div>
        </div>
    );
}
