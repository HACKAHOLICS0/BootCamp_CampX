// src/components/AccountNotifications.js
import React, { useState } from "react";

export default function AccountNotifications() {
  const [showLoginHelp, setShowLoginHelp] = useState(false);
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Account & Notifications</h1>

      {/* Account Settings Section */}
      <section className="mb-5">
        <h2>Account Settings</h2>
        <p>
          Manage your account settings to customize your experience on our platform. Here you can update your profile information, change your password, and manage your privacy settings.
        </p>
        <ul>
          <li><strong>Update Profile:</strong> Change your name, email, and profile picture.</li>
          <li><strong>Change Password:</strong> Ensure your account is secure by updating your password regularly.</li>
          <li><strong>Privacy Settings:</strong> Control who can see your activity and personal information.</li>
        </ul>
      </section>

      {/* Login Issues Section */}
      <section className="mb-5">
        <h2>Login Issues</h2>
        <p>
          If you're having trouble logging in, follow these steps to resolve common issues:
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowLoginHelp(!showLoginHelp)}
        >
          {showLoginHelp ? "Hide Help" : "Show Help"}
        </button>
        {showLoginHelp && (
          <div>
            <ul>
              <li><strong>Forgot Password:</strong> Use the "Forgot Password" link to reset your password.</li>
              <li><strong>Account Locked:</strong> If your account is locked, contact support for assistance.</li>
              <li><strong>Two-Factor Authentication:</strong> Ensure you have access to your two-factor authentication method.</li>
            </ul>
            <p>
              If you continue to experience issues, please contact our support team at <a href="mailto:support@learnerhelpcenter.com">support@learnerhelpcenter.com</a>.
            </p>
          </div>
        )}
      </section>

      {/* Notification Preferences Section */}
      <section className="mb-5">
        <h2>Notification Preferences</h2>
        <p>
          Customize how and when you receive notifications from us. You can choose to receive notifications via email, SMS, or in-app alerts.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowNotificationHelp(!showNotificationHelp)}
        >
          {showNotificationHelp ? "Hide Help" : "Show Help"}
        </button>
        {showNotificationHelp && (
          <div>
            <ul>
              <li><strong>Email Notifications:</strong> Receive updates and alerts directly in your inbox.</li>
              <li><strong>SMS Notifications:</strong> Get important updates sent to your phone.</li>
              <li><strong>In-App Alerts:</strong> Stay informed with real-time notifications within the app.</li>
            </ul>
            <p>
              To manage your notification preferences, go to the <strong>Settings</strong> menu and select <strong>Notifications</strong>.
            </p>
          </div>
        )}
      </section>

      {/* Additional Support Section */}
      <section>
        <h2>Need More Help?</h2>
        <p>
          If you need further assistance, please visit our <a href="/support">Support Center</a> or contact us directly at <a href="mailto:support@learnerhelpcenter.com">support@learnerhelpcenter.com</a>.
        </p>
      </section>
    </div>
  );
}