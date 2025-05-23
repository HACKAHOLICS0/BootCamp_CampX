import axios from "axios";

const API_URL = "https://ikramsegni.fr/api/videos";

export const getVideos = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data; // Retourne la liste des vidéos
  } catch (error) {
    console.error("Erreur lors de la récupération des vidéos :", error);
    return [];
  }
};
