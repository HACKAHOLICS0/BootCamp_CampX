const mongoose = require('mongoose');
const User = require('../Model/User');
const Course = require('../Model/Course');
const Video = require('../Model/Video');
const Category = require('../Model/Category');
const Module = require('../Model/Module');

/**
 * Fonction pour corriger les chemins d'images absolus en chemins relatifs
 */
async function fixImagePaths() {
  try {
    console.log('Début de la correction des chemins d\'images...');
    
    // Correction des chemins d'images pour les utilisateurs
    const users = await User.find({
      image: { $regex: /^\/home\/ubuntu\/camp-final\/campx_finale\/piBack\// }
    });
    
    console.log(`Trouvé ${users.length} utilisateurs avec des chemins d'image absolus`);
    
    for (const user of users) {
      try {
        // Extraire le chemin relatif
        const fullPath = user.image;
        const relativePath = fullPath.split('piBack/')[1];
        
        if (relativePath) {
          // Mettre à jour l'utilisateur avec le chemin relatif
          user.image = relativePath;
          await user.save();
          console.log(`Corrigé le chemin d'image pour l'utilisateur ${user._id}: ${relativePath}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la correction du chemin d'image pour l'utilisateur ${user._id}:`, error);
      }
    }
    
    // Correction des chemins d'images pour les cours
    const courses = await Course.find({
      image: { $regex: /^\/home\/ubuntu\/camp-final\/campx_finale\/piBack\// }
    });
    
    console.log(`Trouvé ${courses.length} cours avec des chemins d'image absolus`);
    
    for (const course of courses) {
      try {
        // Extraire le chemin relatif
        const fullPath = course.image;
        const relativePath = fullPath.split('piBack/')[1];
        
        if (relativePath) {
          // Mettre à jour le cours avec le chemin relatif
          course.image = relativePath;
          await course.save();
          console.log(`Corrigé le chemin d'image pour le cours ${course._id}: ${relativePath}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la correction du chemin d'image pour le cours ${course._id}:`, error);
      }
    }
    
    // Correction des chemins d'images pour les vidéos
    const videos = await Video.find({
      thumbnail: { $regex: /^\/home\/ubuntu\/camp-final\/campx_finale\/piBack\// }
    });
    
    console.log(`Trouvé ${videos.length} vidéos avec des chemins d'image absolus`);
    
    for (const video of videos) {
      try {
        // Extraire le chemin relatif pour la miniature
        if (video.thumbnail) {
          const fullPath = video.thumbnail;
          const relativePath = fullPath.split('piBack/')[1];
          
          if (relativePath) {
            // Mettre à jour la vidéo avec le chemin relatif
            video.thumbnail = relativePath;
            await video.save();
            console.log(`Corrigé le chemin de miniature pour la vidéo ${video._id}: ${relativePath}`);
          }
        }
        
        // Extraire le chemin relatif pour la vidéo
        if (video.videoUrl && video.videoUrl.startsWith('/home/ubuntu/camp-final/campx_finale/piBack/')) {
          const fullPath = video.videoUrl;
          const relativePath = fullPath.split('piBack/')[1];
          
          if (relativePath) {
            // Mettre à jour la vidéo avec le chemin relatif
            video.videoUrl = relativePath;
            await video.save();
            console.log(`Corrigé le chemin de vidéo pour la vidéo ${video._id}: ${relativePath}`);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la correction des chemins pour la vidéo ${video._id}:`, error);
      }
    }
    
    // Correction des chemins d'images pour les catégories
    const categories = await Category.find({
      image: { $regex: /^\/home\/ubuntu\/camp-final\/campx_finale\/piBack\// }
    });
    
    console.log(`Trouvé ${categories.length} catégories avec des chemins d'image absolus`);
    
    for (const category of categories) {
      try {
        // Extraire le chemin relatif
        const fullPath = category.image;
        const relativePath = fullPath.split('piBack/')[1];
        
        if (relativePath) {
          // Mettre à jour la catégorie avec le chemin relatif
          category.image = relativePath;
          await category.save();
          console.log(`Corrigé le chemin d'image pour la catégorie ${category._id}: ${relativePath}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la correction du chemin d'image pour la catégorie ${category._id}:`, error);
      }
    }
    
    // Correction des chemins d'images pour les modules
    const modules = await Module.find({
      image: { $regex: /^\/home\/ubuntu\/camp-final\/campx_finale\/piBack\// }
    });
    
    console.log(`Trouvé ${modules.length} modules avec des chemins d'image absolus`);
    
    for (const module of modules) {
      try {
        // Extraire le chemin relatif
        const fullPath = module.image;
        const relativePath = fullPath.split('piBack/')[1];
        
        if (relativePath) {
          // Mettre à jour le module avec le chemin relatif
          module.image = relativePath;
          await module.save();
          console.log(`Corrigé le chemin d'image pour le module ${module._id}: ${relativePath}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la correction du chemin d'image pour le module ${module._id}:`, error);
      }
    }
    
    console.log('Correction des chemins d\'images terminée');
  } catch (error) {
    console.error('Erreur lors de la correction des chemins d\'images:', error);
  }
}

module.exports = { fixImagePaths };