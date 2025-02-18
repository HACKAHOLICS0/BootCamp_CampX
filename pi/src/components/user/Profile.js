import React, { useState, useEffect } from 'react';
import { useUser } from '../../JS/UserProvider';

export default function Profile() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    // Ajoutez d'autres champs ici
  });

  // Mettre à jour formData lorsque user change
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        // Ajoutez d'autres champs ici
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Envoyer les données mises à jour à l'API
    console.log('Données à mettre à jour:', formData);
  };

  return (
    <div>
      <h1>Profile</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
          />
        </div>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
          />
        </div>
        {/* Ajoutez d'autres champs ici */}
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
