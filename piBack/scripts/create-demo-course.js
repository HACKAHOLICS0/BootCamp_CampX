/**
 * Script pour créer un cours de démonstration avec des exemples de code
 * Ce script crée un cours pour chaque catégorie de langage de programmation
 * avec des exemples de code adaptés à chaque langage
 */

require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const Course = require('../Model/Course');
const Module = require('../Model/Module');
const Category = require('../Model/Category');

// Connexion à MongoDB
console.log('Tentative de connexion à MongoDB...');
console.log('URI MongoDB:', process.env.MONGO_URI ? 'Définie' : 'Non définie');

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('Connexion à MongoDB réussie');
  createDemoCourses();
})
.catch((err) => {
  console.error('Erreur lors de la connexion à MongoDB:', err);
  process.exit(1);
});

// Exemples de code pour différents langages
const codeExamples = {
  javascript: [
    {
      title: 'Introduction aux variables',
      description: 'Apprenez à déclarer et utiliser des variables en JavaScript.',
      code: `// Déclaration de variables
let name = "John";
const age = 30;
var isStudent = true;

// Affichage des variables
console.log("Nom:", name);
console.log("Âge:", age);
console.log("Est étudiant:", isStudent);`,
      language: 'javascript',
      isExercise: false
    },
    {
      title: 'Fonctions en JavaScript',
      description: 'Découvrez comment créer et utiliser des fonctions en JavaScript.',
      code: `// Fonction déclarative
function sayHello(name) {
  return "Bonjour, " + name + "!";
}

// Fonction fléchée
const add = (a, b) => a + b;

// Utilisation des fonctions
console.log(sayHello("Marie"));
console.log("2 + 3 =", add(2, 3));`,
      language: 'javascript',
      isExercise: false
    },
    {
      title: 'Exercice: Calculer la somme d\'un tableau',
      description: 'Écrivez une fonction qui calcule la somme de tous les éléments d\'un tableau.',
      code: `// Écrivez une fonction qui calcule la somme des éléments d'un tableau
function sumArray(arr) {
  // Votre code ici
}

// Tests
const numbers = [1, 2, 3, 4, 5];
console.log(sumArray(numbers)); // Devrait afficher 15`,
      language: 'javascript',
      isExercise: true,
      solution: `function sumArray(arr) {
  return arr.reduce((sum, current) => sum + current, 0);
}`,
      hints: [
        'Utilisez une boucle for ou la méthode reduce() pour parcourir le tableau',
        'Initialisez une variable pour stocker la somme',
        'Pour chaque élément, ajoutez sa valeur à la somme'
      ]
    }
  ],

  python: [
    {
      title: 'Variables et types de données',
      description: 'Découvrez les variables et les types de données en Python.',
      code: `# Déclaration de variables
name = "Alice"
age = 25
is_student = True
height = 1.75

# Affichage des variables
print("Nom:", name)
print("Âge:", age)
print("Est étudiant:", is_student)
print("Taille:", height)`,
      language: 'python',
      isExercise: false
    },
    {
      title: 'Fonctions en Python',
      description: 'Apprenez à créer et utiliser des fonctions en Python.',
      code: `# Définition d'une fonction simple
def say_hello(name):
    return f"Bonjour, {name}!"

# Fonction avec valeur par défaut
def power(base, exponent=2):
    return base ** exponent

# Utilisation des fonctions
print(say_hello("Thomas"))
print(f"2 au carré = {power(2)}")
print(f"2 au cube = {power(2, 3)}")`,
      language: 'python',
      isExercise: false
    },
    {
      title: 'Exercice: Compter les voyelles',
      description: 'Écrivez une fonction qui compte le nombre de voyelles dans une chaîne de caractères.',
      code: `# Écrivez une fonction qui compte le nombre de voyelles dans une chaîne
def count_vowels(text):
    # Votre code ici
    pass

# Tests
print(count_vowels("Hello World"))  # Devrait afficher 3
print(count_vowels("Python Programming"))  # Devrait afficher 4`,
      language: 'python',
      isExercise: true,
      solution: `def count_vowels(text):
    vowels = "aeiouAEIOU"
    count = 0
    for char in text:
        if char in vowels:
            count += 1
    return count`,
      hints: [
        'Créez une chaîne contenant toutes les voyelles (a, e, i, o, u)',
        'Parcourez chaque caractère de la chaîne d\'entrée',
        'Vérifiez si le caractère est une voyelle',
        'N\'oubliez pas de prendre en compte les majuscules et minuscules'
      ]
    }
  ],

  sql: [
    {
      title: 'Requêtes SELECT de base',
      description: 'Apprenez à récupérer des données avec la commande SELECT en SQL.',
      code: `-- Sélectionner toutes les colonnes
SELECT * FROM employees;

-- Sélectionner des colonnes spécifiques
SELECT first_name, last_name, salary FROM employees;

-- Filtrer avec WHERE
SELECT * FROM employees WHERE department_id = 10;`,
      language: 'sql',
      isExercise: false
    },
    {
      title: 'Jointures en SQL',
      description: 'Découvrez comment joindre plusieurs tables en SQL.',
      code: `-- Jointure interne (INNER JOIN)
SELECT e.employee_id, e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- Jointure externe (LEFT JOIN)
SELECT e.employee_id, e.first_name, e.last_name, d.department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.department_id;`,
      language: 'sql',
      isExercise: false
    },
    {
      title: 'Exercice: Requête avec GROUP BY',
      description: 'Écrivez une requête SQL qui compte le nombre d\'employés par département.',
      code: `-- Écrivez une requête qui compte le nombre d'employés par département
-- et trie les résultats par nombre d'employés (du plus grand au plus petit)


-- La table employees a les colonnes: employee_id, first_name, last_name, department_id
-- La table departments a les colonnes: department_id, department_name`,
      language: 'sql',
      isExercise: true,
      solution: `SELECT d.department_name, COUNT(e.employee_id) as employee_count
FROM employees e
JOIN departments d ON e.department_id = d.department_id
GROUP BY d.department_name
ORDER BY employee_count DESC;`,
      hints: [
        'Utilisez COUNT() pour compter le nombre d\'employés',
        'Utilisez GROUP BY pour regrouper par département',
        'Joignez les tables employees et departments',
        'Utilisez ORDER BY ... DESC pour trier par ordre décroissant'
      ]
    }
  ],

  mongodb: [
    {
      title: 'Requêtes de base en MongoDB',
      description: 'Apprenez à effectuer des requêtes de base dans MongoDB.',
      code: `// Trouver tous les documents
db.users.find()

// Trouver avec des critères
db.users.find({ age: { $gt: 25 } })

// Projection (sélectionner certains champs)
db.users.find({}, { name: 1, email: 1, _id: 0 })`,
      language: 'javascript',
      isExercise: false
    },
    {
      title: 'Agrégation en MongoDB',
      description: 'Découvrez le framework d\'agrégation de MongoDB.',
      code: `// Pipeline d'agrégation simple
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customer_id", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])

// Utilisation de $lookup (équivalent de JOIN)
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer_info"
    }
  }
])`,
      language: 'javascript',
      isExercise: false
    },
    {
      title: 'Exercice: Requête d\'agrégation',
      description: 'Écrivez une requête d\'agrégation qui calcule le montant total des commandes par catégorie de produit.',
      code: `// Écrivez une requête d'agrégation qui:
// 1. Filtre les commandes avec status "completed"
// 2. Regroupe par product_category
// 3. Calcule le montant total et le nombre de commandes par catégorie
// 4. Trie par montant total décroissant

// Collection: orders
// Champs: _id, product_category, amount, status`,
      language: 'javascript',
      isExercise: true,
      solution: `db.orders.aggregate([
  { $match: { status: "completed" } },
  {
    $group: {
      _id: "$product_category",
      totalAmount: { $sum: "$amount" },
      orderCount: { $sum: 1 }
    }
  },
  { $sort: { totalAmount: -1 } }
])`,
      hints: [
        'Utilisez $match pour filtrer les commandes complétées',
        'Utilisez $group avec _id: "$product_category" pour regrouper par catégorie',
        'Utilisez $sum pour calculer le montant total et le nombre de commandes',
        'Utilisez $sort pour trier les résultats'
      ]
    }
  ],

  html: [
    {
      title: 'Structure de base HTML',
      description: 'Découvrez la structure de base d\'un document HTML.',
      code: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ma première page</title>
</head>
<body>
  <header>
    <h1>Bienvenue sur mon site</h1>
  </header>

  <main>
    <section>
      <h2>À propos</h2>
      <p>Ceci est ma première page HTML.</p>
    </section>
  </main>

  <footer>
    <p>&copy; 2023 Mon Site</p>
  </footer>
</body>
</html>`,
      language: 'html',
      isExercise: false
    },
    {
      title: 'Formulaires HTML',
      description: 'Apprenez à créer des formulaires en HTML.',
      code: `<form action="/submit" method="post">
  <div>
    <label for="name">Nom :</label>
    <input type="text" id="name" name="name" required>
  </div>

  <div>
    <label for="email">Email :</label>
    <input type="email" id="email" name="email" required>
  </div>

  <div>
    <label for="message">Message :</label>
    <textarea id="message" name="message" rows="4" required></textarea>
  </div>

  <div>
    <label for="subject">Sujet :</label>
    <select id="subject" name="subject">
      <option value="general">Question générale</option>
      <option value="support">Support technique</option>
      <option value="billing">Facturation</option>
    </select>
  </div>

  <button type="submit">Envoyer</button>
</form>`,
      language: 'html',
      isExercise: false
    },
    {
      title: 'Exercice: Créer une carte de profil',
      description: 'Créez une carte de profil en HTML avec une image, un nom, un titre et des liens sociaux.',
      code: `<!-- Créez une carte de profil avec:
1. Une image de profil (utilisez placeholder.com pour l'image)
2. Un nom et un titre professionnel
3. Une courte bio
4. Des liens vers des réseaux sociaux (au moins 3)
5. Un bouton "Contacter"
-->

<!-- Votre code ici -->`,
      language: 'html',
      isExercise: true,
      solution: `<div class="profile-card">
  <img src="https://via.placeholder.com/150" alt="Photo de profil" class="profile-image">
  <h2>John Doe</h2>
  <p class="title">Développeur Web</p>
  <p class="bio">Passionné par le développement web et les nouvelles technologies. J'aime créer des applications web modernes et intuitives.</p>

  <div class="social-links">
    <a href="#" title="LinkedIn"><i class="fab fa-linkedin"></i></a>
    <a href="#" title="GitHub"><i class="fab fa-github"></i></a>
    <a href="#" title="Twitter"><i class="fab fa-twitter"></i></a>
  </div>

  <button class="contact-btn">Contacter</button>
</div>`,
      hints: [
        'Utilisez une div comme conteneur principal avec une classe "profile-card"',
        'Pour l\'image, utilisez la balise <img> avec src="https://via.placeholder.com/150"',
        'Utilisez des balises h2 pour le nom et p pour le titre et la bio',
        'Pour les liens sociaux, créez une div contenant plusieurs liens <a>',
        'N\'oubliez pas d\'ajouter un bouton avec la balise <button>'
      ]
    }
  ],

  css: [
    {
      title: 'Sélecteurs CSS',
      description: 'Apprenez à utiliser différents types de sélecteurs en CSS.',
      code: `/* Sélecteur d'élément */
p {
  color: #333;
  line-height: 1.5;
}

/* Sélecteur de classe */
.highlight {
  background-color: yellow;
  padding: 5px;
}

/* Sélecteur d'ID */
#header {
  background-color: #f0f0f0;
  padding: 20px;
}

/* Sélecteur d'attribut */
input[type="text"] {
  border: 1px solid #ccc;
  padding: 8px;
}

/* Sélecteur d'enfant */
nav > ul {
  list-style: none;
  padding: 0;
}`,
      language: 'css',
      isExercise: false
    },
    {
      title: 'Flexbox en CSS',
      description: 'Découvrez comment utiliser Flexbox pour créer des mises en page flexibles.',
      code: `.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.item {
  flex: 1 1 200px;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 5px;
}

/* Centrer un élément horizontalement et verticalement */
.centered {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}`,
      language: 'css',
      isExercise: false
    },
    {
      title: 'Exercice: Créer une carte responsive',
      description: 'Créez le CSS pour une carte de produit responsive avec image, titre, description et bouton.',
      code: `/* Créez le CSS pour une carte de produit responsive
HTML de référence:
<div class="product-card">
  <img src="product.jpg" alt="Product" class="product-image">
  <div class="product-info">
    <h3 class="product-title">Nom du produit</h3>
    <p class="product-description">Description du produit...</p>
    <div class="product-price">29.99 €</div>
    <button class="buy-button">Acheter</button>
  </div>
</div>
*/

/* Votre code CSS ici */`,
      language: 'css',
      isExercise: true,
      solution: `.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-info {
  padding: 15px;
}

.product-title {
  margin-top: 0;
  color: #333;
}

.product-description {
  color: #666;
  font-size: 0.9rem;
}

.product-price {
  font-weight: bold;
  font-size: 1.2rem;
  color: #e91e63;
  margin: 10px 0;
}

.buy-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.buy-button:hover {
  background-color: #45a049;
}

@media (min-width: 768px) {
  .product-card {
    flex-direction: row;
    max-width: 600px;
  }

  .product-image {
    width: 200px;
    height: auto;
  }
}`,
      hints: [
        'Utilisez display: flex pour organiser les éléments',
        'Ajoutez box-shadow pour créer une ombre portée',
        'Utilisez border-radius pour arrondir les coins',
        'Ajoutez des transitions pour les effets de survol',
        'Utilisez une media query pour rendre la carte responsive'
      ]
    }
  ]
};

// Fonction pour créer un cours de démonstration pour chaque catégorie
async function createDemoCourses() {
  try {
    console.log('Début de la création des cours de démonstration...');

    // Récupérer ou créer une catégorie "Programmation"
    console.log('Recherche de la catégorie "Programmation"...');
    let category = await Category.findOne({ name: 'Programmation' });

    if (!category) {
      console.log('Catégorie "Programmation" non trouvée, création en cours...');
      category = await Category.create({
        name: 'Programmation',
        description: 'Cours de programmation et développement',
        image: 'https://via.placeholder.com/300'
      });
      console.log('Catégorie "Programmation" créée avec ID:', category._id);
    } else {
      console.log('Catégorie "Programmation" trouvée avec ID:', category._id);
    }

    // Créer un module pour chaque langage
    const languages = Object.keys(codeExamples);

    for (const language of languages) {
      // Vérifier si le module existe déjà
      let module = await Module.findOne({
        title: { $regex: new RegExp(language, 'i') },
        category: category._id
      });

      if (!module) {
        // Créer un nouveau module
        module = await Module.create({
          title: `Cours de ${language.charAt(0).toUpperCase() + language.slice(1)}`,
          description: `Apprenez à programmer en ${language}`,
          category: category._id,
          image: `https://via.placeholder.com/300?text=${language}`,
          duration: 20, // Durée en heures
          difficulty: 'beginner'
        });
        console.log(`Module "${module.title}" créé`);
      }

      // Vérifier si le cours existe déjà
      const existingCourse = await Course.findOne({
        title: { $regex: new RegExp(`Introduction.*${language}`, 'i') },
        module: module._id
      });

      if (!existingCourse) {
        // Créer un nouveau cours
        const course = await Course.create({
          title: `Introduction à ${language.charAt(0).toUpperCase() + language.slice(1)}`,
          description: `Apprenez les bases de la programmation en ${language} avec des exemples pratiques et des exercices interactifs.`,
          module: module._id,
          category: language,
          price: 49.99,
          content: `# Introduction à ${language.charAt(0).toUpperCase() + language.slice(1)}

Ce cours vous permettra d'apprendre les fondamentaux de ${language} à travers des exemples concrets et des exercices pratiques.

## Objectifs du cours

- Comprendre la syntaxe de base de ${language}
- Maîtriser les structures de contrôle et les fonctions
- Développer des applications simples en ${language}
- Pratiquer avec des exercices interactifs

## Prérequis

- Connaissances de base en informatique
- Aucune expérience préalable en programmation n'est nécessaire

Bon apprentissage !`,
          duration: 10,
          difficulty: 'beginner',
          tags: [language, 'programmation', 'débutant'],
          thumbnail: `https://via.placeholder.com/300?text=${language}`,
          codeExamples: codeExamples[language]
        });

        console.log(`Cours "${course.title}" créé avec ${course.codeExamples.length} exemples de code`);
      } else {
        console.log(`Le cours pour ${language} existe déjà`);
      }
    }

    console.log('Création des cours de démonstration terminée');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création des cours de démonstration:', error);
    process.exit(1);
  }
}
