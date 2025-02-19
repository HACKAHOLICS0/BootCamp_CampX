import "../../assets/css/user.css";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const backendURL = "http://localhost:5000";

const getImageUrl = (imagePath) => {
    return imagePath ? `${backendURL}/${imagePath.replace(/\\/g, "/")}` : "/uploads/avatar7.png";
};

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInterestPointModalOpen, setIsInterestPointModalOpen] = useState(false);
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
                const response = await fetch(`${backendURL}/api/interest-points`);
                const data = await response.json();
                console.log("Fetched interest points:", data);
    
                setInterestPoints(data);
    
                if (user && user.interestPoints) {
                    const filteredPoints = data.filter(point => user.interestPoints.includes(point.value));
                    setSelectedPoints(filteredPoints.map(point => point.value));
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
        if (!user || !user._id) {
            console.log("No user or user ID found.");
            return;
        }
    
        console.log("User ID passed as parameter:", user._id); // Ajout du log pour afficher l'ID
    
        try {
            const response = await fetch(`${backendURL}/api/auth/${user._id}`, {
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
                                    <img src={getImageUrl(user.image)} className="rounded-circle" width="200" alt="User Avatar" />
                                    <div className="mt-3">
                                        <h4>{user.name || "User"}</h4>
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
                                            Edit
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
                                                >
                                                    <div className="card-body" style={{ padding: '10px' }}>
                                                        <h5>{typeof point === 'string' ? point : JSON.stringify(point)}</h5>
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
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <span className="close" onClick={closeModal}>&times;</span>
                            <h4>Edit User Information</h4>
{Object.keys(editableUser).map((key, index) => (

                                <div key={index} className="form-group">
                                    <label>{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <input
                                        type={key === "birthDate" ? "date" : "text"}
                                        className="form-control"
                                        value={editableUser[key]}
                                        onChange={(e) => {
                                            setEditableUser({ ...editableUser, [key]: e.target.value });
                                            validateField(key);
                                        }}
                                    />
                                    {errors[key] && <small className="text-danger">{errors[key]}</small>}
                                </div>
                            ))}
                            <div className="text-end mt-3">
                                <button className="save-button" onClick={handleSaveUser} disabled={!isFormValid}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isInterestPointModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <span className="close" onClick={closeInterestPointModal}>&times;</span>
                            <h4>Select Points of Interest</h4>
                            <div className="interest-points-container">
                                {interestPoints.map((point, index) => (
                                    <div key={index} className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={selectedPoints.includes(point.value)}
                                            onChange={() => handlePointSelection(point)}
                                        />
                                        <label className="form-check-label">{point.label}</label>
                                    </div>
                                ))}
                            </div>
                            <div className="text-end mt-3">
                                <button className="save-button" onClick={handleSaveSelection}>
                                    Save Selection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

