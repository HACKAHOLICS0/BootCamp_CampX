import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import CertificateList from './Certificate/CertificateList';
import "../../assets/css/user.css";

const backendURL = "https://ikramsegni.fr";
const getImageUrl = (user) => {
    // Vérifie si l'utilisateur ou son image est défini
    if (!user || !user.image) {
        return "/uploads/avatar7.png"; // Image par défaut
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
        return `${backendURL}/${relativePath}`;
    }

    // Cas pour les chemins avec backslashes (comme uploads\\1746221655607-unnamed.jpg)
    if (user.image.includes('\\')) {
        // Remplacer tous les backslashes par des forward slashes
        const normalizedPath = user.image.replace(/\\/g, "/");
        return `${backendURL}/${normalizedPath}`;
    }

    // Pour les chemins relatifs standards (uploads/...)
    if (user.image.startsWith('uploads/')) {
        return `${backendURL}/${user.image}`;
    }

    // Fallback pour tout autre format
    return `${backendURL}/${user.image}`;
};
export default function UserProfile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInterestPointModalOpen, setIsInterestPointModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pointToDelete, setPointToDelete] = useState(null);
    const [purchasedCourses, setPurchasedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'courses', 'certificates'

    const [editableUser, setEditableUser] = useState({
        name: "", lastName: "", birthDate: "", email: "", phone: ""
    });
    const [interestPoints, setInterestPoints] = useState([]);
    const [selectedPoints, setSelectedPoints] = useState([]);

    useEffect(() => {
        const storedUser = Cookies.get("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log("user avec cookie ",parsedUser);
            setUser(parsedUser);
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






    const validateField = (field, value) => {
        let error = "";
        switch (field) {
            case "name":
                if (!value) error = "Name is required";
                else if (value.length < 2) error = "Name must be at least 2 characters";
                else if (!/^[a-zA-Z\s]*$/.test(value)) error = "Name can only contain letters and spaces";
                break;
            case "lastName":
                if (!value) error = "Last name is required";
                else if (value.length < 2) error = "Last name must be at least 2 characters";
                else if (!/^[a-zA-Z\s]*$/.test(value)) error = "Last name can only contain letters and spaces";
                break;
            case "email":
                if (!value) error = "Email is required";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
                break;
            case "phone":
                if (!value) {
                    error = "Phone number is required";
                } else {
                    // Supprimer les espaces et les caractères spéciaux pour la validation
                    const cleanPhone = value.replace(/[\s-()]/g, '');
                    if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
                        error = "Phone number must be between 8 and 15 digits and can start with +";
                    }
                }
                break;
            case "birthDate":
                if (!value) {
                    error = "Birth date is required";
                } else {
                    const birthDate = new Date(value);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();

                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }

                    if (age < 16) {
                        error = "You must be at least 16 years old";
                    } else if (birthDate > today) {
                        error = "Birth date cannot be in the future";
                    }
                }
                break;
        }
        return error;
    };

    const handleInputChange = (field, value) => {
        // Formatage spécial pour le numéro de téléphone
        if (field === "phone") {
            // Supprimer tous les caractères non numériques sauf le + au début
            const cleanValue = value.replace(/[^\d+]/g, '');
            // Limiter la longueur à 15 caractères
            const limitedValue = cleanValue.slice(0, 15);
            value = limitedValue;
        }

        setEditableUser(prev => ({
            ...prev,
            [field]: value
        }));

        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));

        // Check if all fields are valid
        const newErrors = { ...errors, [field]: error };
        const isValid = !Object.values(newErrors).some(error => error !== '') &&
                       Object.values(editableUser).every(value => value !== '');
        setIsFormValid(isValid);
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

    const fetchPurchasedCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = Cookies.get('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${backendURL}/api/courses/purchased`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to fetch purchased courses');
            }

            const courses = await response.json();
            console.log('Fetched purchased courses:', courses);
            setPurchasedCourses(courses);
        } catch (error) {
            console.error('Error fetching purchased courses:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPurchasedCourses();
        }
    }, [user]);



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
                                    </div>

                                    {/* Navigation des onglets */}
                                    <div className="profile-tabs mt-4">
                                        <ul className="nav nav-tabs">
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('info')}
                                                >
                                                    <i className="bi bi-person me-1"></i> Profil
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === 'interests' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('interests')}
                                                >
                                                    <i className="bi bi-star me-1"></i> Intérêts
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === 'certificates' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('certificates')}
                                                >
                                                    <i className="bi bi-award me-1"></i> Certificats
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-8 mb-3 d-flex align-items-stretch">
                            {activeTab === 'info' && (
                                <div className="card-user w-100">
                                    <div className="card-body card-body-user">
                                        <h4 className="text-center my-3">Informations Personnelles</h4>
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
                                            <button className="edit-button" onClick={handleEditUser} title="Modifier">
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'interests' && (
                                <div className="card card-point w-100" style={{ position: 'relative' }}>
                                    <div className="section-header">
                                        <h4 className="section-title">Points d'Intérêt</h4>
                                    </div>
                                    <div className="row p-3">
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
                                                        onClick={() => openDeleteModal(typeof point === 'string' ? point : point.value)}
                                                    >
                                                        <div className="card-body" style={{ padding: '10px' }}>
                                                            <h5>{typeof point === 'string' ? point : point.value}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center">Aucun point d'intérêt disponible.</p>
                                        )}
                                    </div>
                                    <button
                                        className="edit-button"
                                        onClick={openInterestPointModal}
                                        title="Ajouter un point d'intérêt"
                                        style={{
                                            position: 'absolute',
                                            bottom: '15px',
                                            right: '15px',
                                            backgroundColor: '#5FCF80',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '45px',
                                            height: '45px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                                            zIndex: '1'
                                        }}
                                    >
                                        <i className="bi bi-plus"></i>
                                    </button>
                                </div>
                            )}

                            {activeTab === 'certificates' && (
                                <div className="card w-100 certificate-tab-container">
                                    <CertificateList />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isModalOpen && (
    <div className="edit-modal-overlay">
        <div className="edit-modal-content">
            <span className="edit-modal-close" onClick={closeModal}>&times;</span>
            <h4 className="edit-modal-title">Edit User Information</h4>
            <form className="edit-modal-form">
                {["name", "lastName", "birthDate", "email", "phone"].map((field) => (
                    <div key={field} className="edit-form-group">
                        <label className="edit-form-label">
                            {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                        </label>
                        <input
                            type={field === "birthDate" ? "date" : field === "email" ? "email" : "text"}
                            className={`edit-form-control ${errors[field] ? "is-invalid" : ""} ${field === "email" ? "readonly-input" : ""}`}
                            value={editableUser[field]}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            readOnly={field === "email"}
                        />
                        {errors[field] && <small className="text-danger">{errors[field]}</small>}
                    </div>
                ))}
                <div className="edit-modal-footer">
                    <button
                        className="edit-save-button"
                        onClick={handleSaveUser}
                        disabled={!isFormValid}
                    >
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

<div className="card mb-4">
    <div className="card-header">
        <h5 className="mb-0">Purchased Courses</h5>
    </div>
    <div className="card-body">
        {loading ? (
            <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        ) : error ? (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        ) : purchasedCourses.length === 0 ? (
            <div className="text-center">
                <p className="text-muted mb-0">You haven't purchased any courses yet.</p>
                <button
                    className="btn btn-primary mt-3"
                    onClick={() => navigate('/categories')}
                >
                    Browse Courses
                </button>
            </div>
        ) : (
            <div className="row">
                {purchasedCourses.map(course => (
                    <div key={course._id} className="col-md-6 mb-3">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">{course.title}</h5>
                                <p className="card-text">{course.description}</p>

                                <div className="progress mb-3">
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ width: `${course.progress}%` }}
                                        aria-valuenow={course.progress}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    >
                                        {course.progress}%
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <div>

                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => navigate(`/categories/${course.category?._id}/modules/${course.module?._id}/courses/${course._id}`)}
                                    >
                                        Continue Learning
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
</div>

            </div>
        </div>
    );
}