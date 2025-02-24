// src/App.js
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Footer from './components/Footer';
import Navbar from './components/navbar';
import Template from './template';
import Signin from './components/user/signin';
import Signup from './components/user/signup';
import VerifyCode from './components/user/VerifyCode';
import ResetPassword from './components/user/ResetPassword';
import ForgotPassword from './components/user/forgetPassword';
import ResetPasswordEmail from './components/user/ResetPasswordEmail';
import VerifyCodeEmail from './components/user/VerifyCodeEmail';
import GoogleRedirectHandler from './components/user/GoogleRedirectHandler';
import UserProfile from './components/user/UserProfile';

import LearnerHelpCenter from "./components/helpcenter/LearnerHelpCenter"; // Add this import
import AccountNotifications from "./components/helpcenter/AccountNotifications"; // Import the new component
import PaymentsSubscriptions from "./components/helpcenter/PaymentsSubscriptions"; // Import the new component
import "bootstrap-icons/font/bootstrap-icons.css";

function App() {
  const location = useLocation();

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forget-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />   
          <Route path="/resetpasswordemail" element={<ResetPasswordEmail />} />      
          <Route path="/verifycodeEmail" element={<VerifyCodeEmail />} />
          <Route path="/profile" element={<UserProfile />} />
          {/* Route for handling the Google redirect */}
          <Route path="/google/:token" element={<GoogleRedirectHandler />} />
          
          <Route path="/learner-help-center" element={<LearnerHelpCenter />} />
          <Route path="/account-notifications" element={<AccountNotifications />} />
        <Route path="/payments-subscriptions" element={<PaymentsSubscriptions />} />
      
        </Routes>
        {location.pathname !== "/signin" && location.pathname !== "/signup" && location.pathname !== "/forget-password" && location.pathname !== "/profile" && <Template />}

        <Footer />
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
