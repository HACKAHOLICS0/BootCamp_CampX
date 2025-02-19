import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../assets/css/signup.css'; // Ajoute les styles

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
                errors.name = value ? "" : "Name is required";
                break;
            case "lastName": // Fixed extra space
                errors.lastName = value ? "" : "Last Name is required";
                break;
            case "email":
                errors.email = value ? "" : "Email is required";
                break;
            case "phone":
                errors.phone = onlyNumbers.test(value) ? "" : "Only numbers are allowed";
                break;
            case "password":
                errors.password =
                    isContainsUppercase.test(value) &&
                    isContainsLowercase.test(value) &&
                    isContainsNumber.test(value) &&
                    isValidLength.test(value)
                        ? ""
                        : "Password must contain between 8 and 16 characters, including at least 1 uppercase, 1 lowercase, and 1 number.";
                break;
            case "confirmp":
                errors.confirmp = value === formData.password ? "" : "Passwords do not match";
                break;
            case "image":
                errors.image = value ? "" : "Image is required";
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
        try {
            // Vérifie si l'email existe déjà
            const emailCheckResponse = await fetch(`http://localhost:5000/api/auth/check/${formData.email}`);
            const emailExists = await emailCheckResponse.json();
    
            if (emailExists.exists) {
                setErrorDisplay("Email already exists");
                return;
            }
    
            const formDataToSend = new FormData();
            for (const key in formData) {
                formDataToSend.append(key, formData[key]);
            }
    
            const signupResponse = await fetch("http://localhost:5000/api/auth/signup", {
                method: "POST",
                body: formDataToSend, // Utilisez FormData ici
            });
    
            if (!signupResponse.ok) {
                const errorData = await signupResponse.json();
                throw new Error(errorData.message || "Failed to sign up");
            }
    
            history("/signin");
    
        } catch (err) {
            console.error("Error during signup:", err);
            setErrorDisplay(err.message || "An error occurred. Please try again.");
        }
    };

    // Déterminer si le formulaire est valide ou non pour ajuster la couleur du bouton
    const isFormValid = Object.values(formErrors).every((err) => err === "") && Object.values(formData).every((val) => val !== "");

    return (
        <div className="my-5">
            <h1 className="logo mx-auto" style={{ textAlign: "center", color: "#5fcf80" }}>
                Sign Up
            </h1>
            <form className="w-50 mx-auto" onSubmit={onSubmit}>
                {/* Form Fields */}
                <div className="form-group">
                    <input
                        type="text"
                        className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                        id="name"
                        name="name"
                        placeholder="Enter Name"
                        value={formData.name}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        className={`form-control ${formErrors.lastName ? "is-invalid" : ""}`} // Fixed class and variable
                        id="lastName"
                        name="lastName"
                        placeholder="Enter Last Name"
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
                        placeholder="Enter Phone"
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
                        placeholder="Enter Email"
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
                        placeholder="Enter Password"
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
                        placeholder="Confirm Password"
                        value={formData.confirmp}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                    {formErrors.confirmp && <div className="invalid-feedback">{formErrors.confirmp}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="file"
                        className={`form-control ${formErrors.image ? "is-invalid" : ""}`}
                        id="image"
                        name="image"
                        onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                    />
                    {formErrors.image && <div className="invalid-feedback">{formErrors.image}</div>}
                </div>

                {/* Error Display */}
                <div style={{ textAlign: "center", color: "red" }}>{errorDisplay}</div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className={`ms-auto my-2 btn ${isFormValid ? "btn-success" : "btn-secondary"}`}
                    disabled={!isFormValid}
                >
                    Submit
                </button>
            </form>
        </div>
    );
}