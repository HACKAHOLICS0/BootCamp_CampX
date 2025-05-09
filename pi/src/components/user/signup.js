import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../assets/css/signup.css'; // Ajoute les styles
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Signup() {
    const history = useNavigate();

    const [errorDisplay, setErrorDisplay] = useState("");
    const [formErrors, setFormErrors] = useState({
        name: "",
        lastName: "",
        birthDate: "",
        phone: "",
        email: "",
        password: "",
        confirmp: "",
        image: "",
    });
    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        birthDate: "",
        phone: "",
        email: "",
        password: "",
        confirmp: "",
        type: "user",
        image: null, // Ajout d'une clé pour l'image
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isImageValid, setIsImageValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Appeler la validation en temps réel pour chaque champ
        validate(name, value);
    };

    const onBlur = (e) => {
        // Validation quand l'utilisateur sort d'un champ sans entrer de valeur
        const { name, value } = e.target;
        if (!value) {
            validate(name, value);
        }
    };

    const validate = (fieldName, value) => {
        const errors = { ...formErrors }; // clone formErrors pour modification de champ spécifique
        const isContainsUppercase = /^(?=.*[A-Z])/;
        const isContainsLowercase = /^(?=.*[a-z])/;
        const isContainsNumber = /^(?=.*[0-9])/;
        const isValidLength = /^.{8,16}$/;
        const onlyNumbers = /^-?\d*\.?\d*$/;

        switch (fieldName) {
            case "name":
                errors.name = value ? "" : "Le nom est requis";
                break;
            case "lastName": // Fixed extra space
                errors.lastName = value ? "" : "Le nom de famille est requis";
                break;
            case "email":
                errors.email = value ? "" : "L'email est requis";
                break;
            case "phone":
                errors.phone = onlyNumbers.test(value) ? "" : "Seuls les chiffres sont autorisés";
                break;
            case "password":
                errors.password =
                    isContainsUppercase.test(value) &&
                    isContainsLowercase.test(value) &&
                    isContainsNumber.test(value) &&
                    isValidLength.test(value)
                        ? ""
                        : "Le mot de passe doit contenir entre 8 et 16 caractères, avec au moins 1 majuscule, 1 minuscule et 1 chiffre.";
                break;
            case "confirmp":
                errors.confirmp = value === formData.password ? "" : "Les mots de passe ne correspondent pas";
                break;
            case "image":
                errors.image = value ? "" : "L'image est requise";
                break;
            default:
                break;
        }
        setFormErrors(errors);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const errors = validateAllFields();
        setFormErrors(errors);

        if (Object.values(errors).every((err) => err === "")) {
            // Si le formulaire est valide, envoie les données à l'API
            await addUser();
        }
    };

    const validateAllFields = () => {
        const errors = {};
        Object.keys(formData).forEach((key) => {
            validate(key, formData[key]);
        });
        return errors;
    };

    const addUser = async () => {
        setIsSubmitting(true);
        try {
            // Vérifie si l'email existe déjà
            try {
                const emailCheckResponse = await fetch(`https://ikramsegni.fr/api/auth/check/${formData.email}`);
                if (!emailCheckResponse.ok) {
                    throw new Error("Erreur lors de la vérification de l'email");
                }
                const emailExists = await emailCheckResponse.json();

                if (emailExists.exists) {
                    setErrorDisplay("Cet email est déjà utilisé");
                    toast.error("Cet email est déjà utilisé", {
                        position: "top-right",
                        autoClose: 5000
                    });
                    return;
                }
            } catch (emailCheckError) {
                console.error("Erreur lors de la vérification de l'email:", emailCheckError);
                toast.error("Erreur lors de la vérification de l'email. Veuillez réessayer.", {
                    position: "top-right",
                    autoClose: 5000
                });
                throw emailCheckError;
            }

            // Vérifier que l'image est valide
            if (!isImageValid) {
                setErrorDisplay("Veuillez télécharger et valider une photo de profil");
                toast.error("Veuillez télécharger et valider une photo de profil", {
                    position: "top-right",
                    autoClose: 5000
                });
                return;
            }

            // Préparer les données à envoyer
            const formDataToSend = new FormData();
            for (const key in formData) {
                if (key !== 'confirmp') { // Ne pas envoyer la confirmation du mot de passe
                    formDataToSend.append(key, formData[key]);
                }
            }

            try {
                toast.info("Inscription en cours...", {
                    position: "top-right",
                    autoClose: 3000
                });

                const signupResponse = await fetch("https://ikramsegni.fr/api/auth/signup", {
                    method: "POST",
                    body: formDataToSend,
                });

                // Récupérer d'abord les données de la réponse
                const responseText = await signupResponse.text();
                let responseData;

                try {
                    // Essayer de parser le JSON
                    responseData = JSON.parse(responseText);
                } catch (jsonError) {
                    console.error("Erreur lors du parsing JSON:", jsonError, "Texte reçu:", responseText);
                    throw new Error("Réponse invalide du serveur. Veuillez réessayer.");
                }

                // Vérifier si la réponse est un succès
                if (!signupResponse.ok) {
                    throw new Error(responseData.error || responseData.message || "Échec de l'inscription");
                }

                // Afficher le message de succès
                const successMessage = responseData.message || "Inscription réussie ! Veuillez vérifier votre email.";
                console.log("Inscription réussie:", successMessage);

                // Afficher le message de succès
                toast.success(successMessage, {
                    position: "top-right",
                    autoClose: 5000,
                    onClose: () => {
                        // Redirection vers la page de connexion après la fermeture du toast
                        history("/signin");
                    }
                });

                // Redirection vers la page de connexion après un délai
                setTimeout(() => {
                    history("/signin");
                }, 3000);
            } catch (signupError) {
                console.error("Erreur lors de l'inscription:", signupError);
                const errorMessage = signupError.message || "Une erreur est survenue lors de l'inscription";
                setErrorDisplay(errorMessage);
                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 5000
                });
                throw signupError;
            }
        } catch (err) {
            console.error("Erreur générale lors de l'inscription:", err);
            const errorMessage = err.message || "Une erreur inattendue est survenue. Veuillez réessayer.";
            setErrorDisplay(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateImage = async (file) => {
        setIsValidating(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            console.log("Validation d'image en cours...", file.name, file.size, file.type);

            // Vérifier si le fichier est une image
            if (!file.type.startsWith('image/')) {
                setIsImageValid(false);
                toast.error('Le fichier doit être une image (jpg, png, etc.)', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    style: {
                        backgroundColor: '#f44336',
                        color: 'white'
                    }
                });
                return { isValid: false, message: 'Le fichier doit être une image' };
            }

            // Vérifier la taille de l'image (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setIsImageValid(false);
                toast.error('L\'image est trop grande (max 5MB)', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    style: {
                        backgroundColor: '#f44336',
                        color: 'white'
                    }
                });
                return { isValid: false, message: 'L\'image est trop grande' };
            }

            try {
                const response = await axios.post('https://ikramsegni.fr/api/auth/validate-image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000 // 30 secondes de timeout
                });

                console.log("Réponse de validation:", response.data);

                if (response.data && response.data.isValid) {
                    setIsImageValid(true);
                    toast.success('Image valide !', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        style: {
                            backgroundColor: '#4CAF50',
                            color: 'white'
                        }
                    });
                    return response.data;
                } else {
                    const message = response.data?.message || 'Image invalide pour une raison inconnue';
                    setIsImageValid(false);
                    toast.error(`Image invalide: ${message}`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        style: {
                            backgroundColor: '#f44336',
                            color: 'white'
                        }
                    });
                    return { isValid: false, message };
                }
            } catch (axiosError) {
                console.error("Erreur axios lors de la validation:", axiosError);

                // Gérer les différents types d'erreurs Axios
                if (axiosError.response) {
                    // Le serveur a répondu avec un code d'erreur
                    console.error("Erreur de réponse:", axiosError.response.data);
                    const message = axiosError.response.data?.message || axiosError.response.data?.error || 'Erreur de validation côté serveur';
                    toast.error(message, {
                        position: "top-right",
                        autoClose: 5000
                    });
                    return { isValid: false, message };
                } else if (axiosError.request) {
                    // La requête a été faite mais pas de réponse
                    console.error("Pas de réponse du serveur:", axiosError.request);
                    toast.error('Le serveur ne répond pas. Veuillez réessayer plus tard.', {
                        position: "top-right",
                        autoClose: 5000
                    });
                    return { isValid: false, message: 'Le serveur ne répond pas' };
                } else if (axiosError.code === 'ECONNABORTED') {
                    // Timeout
                    toast.error('La validation prend trop de temps. Veuillez réessayer.', {
                        position: "top-right",
                        autoClose: 5000
                    });
                    return { isValid: false, message: 'Timeout lors de la validation' };
                } else {
                    // Erreur lors de la configuration de la requête
                    console.error("Erreur de configuration:", axiosError.message);
                    toast.error('Erreur lors de la validation. Veuillez réessayer.', {
                        position: "top-right",
                        autoClose: 5000
                    });
                    return { isValid: false, message: axiosError.message };
                }
            }
        } catch (error) {
            console.error("Erreur générale de validation d'image:", error);
            setIsImageValid(false);

            // Message d'erreur plus détaillé
            const errorMessage = 'Erreur inattendue lors de la validation de l\'image';
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                style: {
                    backgroundColor: '#f44336',
                    color: 'white'
                }
            });
            return { isValid: false, message: errorMessage };
        } finally {
            setIsValidating(false);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Afficher un aperçu de l'image
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            // Valider l'image
            await validateImage(file);
            setFormData(prev => ({ ...prev, image: file }));
        }
    };

    // Déterminer si le formulaire est valide ou non pour ajuster la couleur du bouton
    const isFormValid = Object.values(formErrors).every((err) => err === "") && Object.values(formData).every((val) => val !== "");

    return (
        <div className="my-5">
            <h1 className="logo mx-auto" style={{ textAlign: "center", color: "#5fcf80" }}>
                Inscription
            </h1>
            <form className="w-50 mx-auto" onSubmit={onSubmit}>
                {/* Form Fields */}
                <div className="form-group">
                    <input
                        type="text"
                        className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                        id="name"
                        name="name"
                        placeholder="Entrez votre prénom"
                        value={formData.name}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        className={`form-control ${formErrors.lastName ? "is-invalid" : ""}`}
                        id="lastName"
                        name="lastName"
                        placeholder="Entrez votre nom de famille"
                        value={formData.lastName}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.lastName && <div className="invalid-feedback">{formErrors.lastName}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="date"
                        className={`form-control ${formErrors.birthDate ? "is-invalid" : ""}`}
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.birthDate && <div className="invalid-feedback">{formErrors.birthDate}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
                        id="phone"
                        name="phone"
                        placeholder="Entrez votre numéro de téléphone"
                        value={formData.phone}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="email"
                        className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                        id="email"
                        name="email"
                        placeholder="Entrez votre email"
                        value={formData.email}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="password"
                        className={`form-control ${formErrors.password ? "is-invalid" : ""}`}
                        id="password"
                        name="password"
                        placeholder="Entrez votre mot de passe"
                        value={formData.password}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="password"
                        className={`form-control ${formErrors.confirmp ? "is-invalid" : ""}`}
                        id="confirmp"
                        name="confirmp"
                        placeholder="Confirmez votre mot de passe"
                        value={formData.confirmp}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.confirmp && <div className="invalid-feedback">{formErrors.confirmp}</div>}
                </div>

                <div className="form-group">
                    <label>Photo de profil</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="form-control"
                        disabled={isValidating}
                    />
                    {imagePreview && (
                        <div className="image-preview mt-3">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                    maxWidth: '200px',
                                    maxHeight: '200px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '2px solid #ddd'
                                }}
                            />
                        </div>
                    )}
                    {isValidating && (
                        <div className="mt-2 text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Validation...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Display */}
                <div style={{ textAlign: "center", color: "red" }}>{errorDisplay}</div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className={`ms-auto my-2 btn ${isFormValid ? "btn-success" : "btn-secondary"}`}
                    disabled={!isFormValid || !isImageValid || isSubmitting}
                >
                    {isSubmitting ? 'Validation...' : 'S\'inscrire'}
                </button>
            </form>
        </div>
    );
}