// src/components/user/GoogleLoginButton.js
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton({ onSuccess, onError }) {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        // Le credentialResponse contient un token JWT Google (id_token)
        // Vous pouvez l'envoyer au backend pour vérification et création/connexion de l'utilisateur.
        if (onSuccess) onSuccess(credentialResponse);
      }}
      onError={() => {
        console.log('Google Login Failed');
        if (onError) onError();
      }}
    />
  );
}
