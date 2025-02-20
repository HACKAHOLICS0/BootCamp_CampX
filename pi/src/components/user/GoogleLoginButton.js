// src/components/user/GoogleLoginButton.js
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import Cookies from "js-cookie"; // Import de js-cookie

export default function GoogleLoginButton() {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        fetch("http://localhost:5000/api/auth/google/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: credentialResponse.credential }),
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.token) {
            Cookies.set("token", data.token, { expires: 7 });
            Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
            window.dispatchEvent(new Event("userUpdated"));
            window.location.href = "/";
          }
        });
      }}
      onError={() => {
        console.log("Google Login Failed");
      }}
    />
  );
}

