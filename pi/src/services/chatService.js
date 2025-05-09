import axios from 'axios';

const API_URL = "https://ikramsegni.fr";  // URL complète pour le backend
// Récupérer le token depuis les cookies (ou localStorage si tu l'utilises)
const getAuthToken = () => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))?.split('=')[1];
  if (!token) {
    console.error('Token not found');
  }
  return token;
};

// Service pour gérer les requêtes au chatbot
const chatService = {
  createConversation: async (userId) => {
    try {
      const token = getAuthToken();
      const response = await axios.post("https://ikramsegni.fr/api/chat/conversations", { userId }, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;  
      
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      throw error;
    }
  },

  // Obtenir les conversations d'un utilisateur avec authentification
  getUserConversations: async (userId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/conversations/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      throw error;
    }
  },
  
  // Obtenir une conversation spécifique
  getConversation: async (conversationId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation:', error);
      throw error;
    }
  },

  // Envoyer un message et obtenir une réponse
  sendMessage: async (conversationId, message) => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_URL}/conversations/${conversationId}/messages`, 
        { message },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  },

  // Supprimer une conversation
  deleteConversation: async (conversationId) => {
    try {
      const token = getAuthToken();
      const response = await axios.delete(`${API_URL}/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      throw error;
    }
  }
};

export default chatService;
