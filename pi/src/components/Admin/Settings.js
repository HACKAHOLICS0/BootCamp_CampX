import React from 'react';
import './AdminStyle.css'
const Settings = () => (
  <div className="content-section">
    <h2>Settings</h2>
    <form className="settings-form">
      <div className="form-group">
        <label>Site Name</label>
        <input type="text" defaultValue="Admin Dashboard" />
      </div>
      <div className="form-group">
        <label>Email Notifications</label>
        <label className="switch">
          <input type="checkbox" defaultChecked />
          <span className="slider"></span>
        </label>
      </div>
      <div className="form-group">
        <label>Language</label>
        <select defaultValue="en">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
      <button type="submit" className="save-btn">Save Changes</button>
    </form>
  </div>
);

export default Settings;