import os
import pickle
import json
import argparse
import nltk
import numpy as np
import tensorflow as tf
from nltk.stem import WordNetLemmatizer
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from flask_cors import CORS
from collections import defaultdict
import time
import requests
import random

app = Flask(__name__)
CORS(app)  # Active CORS pour toutes les routes
CORS(app, origins=["http://localhost:5000"])


class ChatbotPredictor:
    def __init__(self, model_name='chatbot_model'):
        # Chemin du dossier des modèles
        self.models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../models')
        self.model_name = model_name
        self.lemmatizer = WordNetLemmatizer()
        
        # Initialiser l'API token
        self.api_token = None
        
        # Historique des conversations par utilisateur
        self.conversation_history = defaultdict(list)
        self.response_history = defaultdict(dict)
        self.last_responses = defaultdict(str)
        
        # Charger les abréviations
        try:
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../utils/abbreviations.json'), 'r', encoding='utf-8') as f:
                self.abbreviations = json.load(f)['abbreviations']
        except Exception as e:
            print(f"Erreur lors du chargement des abréviations: {e}")
            self.abbreviations = {}
        
        # Télécharger les ressources NLTK nécessaires
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('wordnet')
        except LookupError:
            nltk.download('punkt')
            nltk.download('wordnet')
        
        # Charger les fichiers nécessaires
        try:
            self.words = pickle.load(open(os.path.join(self.models_dir, f'{model_name}_words.pkl'), 'rb'))
            self.classes = pickle.load(open(os.path.join(self.models_dir, f'{model_name}_classes.pkl'), 'rb'))
            self.model = load_model(os.path.join(self.models_dir, f'{model_name}.h5'))
            
            # Charger les intentions
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'intents.json'), 'r', encoding='utf-8') as f:
                self.intents = json.load(f)
                
            print("Modèle chargé avec succès!")
        except Exception as e:
            print(f"Erreur lors du chargement du modèle: {e}")
            print("Assurez-vous d'avoir entraîné le modèle avant de l'utiliser.")
            self.words = []
            self.classes = []
            self.model = None
            self.intents = {"intents": []}
        
        # Ajouter un cache pour les cours
        self.user_courses_cache = {}
        self.course_search_state = defaultdict(lambda: {"searching": False, "last_query": None})
        
    def set_api_token(self, token):
        """Définir le token API pour les requêtes"""
        self.api_token = token
        
    def _expand_abbreviations(self, sentence):
        """Remplace les abréviations par leurs formes complètes"""
        words = sentence.lower().split()
        expanded_words = [self.abbreviations.get(word, word) for word in words]
        return ' '.join(expanded_words)
    
    def _normalize_input(self, sentence):
        """Normalise l'entrée en remplaçant les abréviations et en la mettant en minuscules"""
        expanded = self._expand_abbreviations(sentence.lower().strip())
        return expanded
    
    def _clean_up_sentence(self, sentence):
        """Tokenize et lemmatize une phrase"""
        # Expander les abréviations avant le traitement
        expanded_sentence = self._expand_abbreviations(sentence)
        sentence_words = nltk.word_tokenize(expanded_sentence.lower())
        sentence_words = [self.lemmatizer.lemmatize(word) for word in sentence_words]
        return sentence_words
    
    def _bag_of_words(self, sentence):
        """Crée un sac de mots à partir d'une phrase"""
        sentence_words = self._clean_up_sentence(sentence)
        bag = [0] * len(self.words)
        for w in sentence_words:
            for i, word in enumerate(self.words):
                if word == w:
                    bag[i] = 1
        return np.array(bag)
    
    def predict_class(self, sentence, error_threshold=0.25):
        """Prédit la classe d'intention à partir d'une phrase"""
        if not self.model:
            return [{"intent": "error", "probability": 1.0}]
        
        # Génère les probabilités à partir du modèle
        bow = self._bag_of_words(sentence)
        if not any(bow):  # Si le sac de mots est vide (aucun mot reconnu)
            return [{"intent": "unknown", "probability": 1.0}]
            
        res = self.model.predict(np.array([bow]))[0]
        
        # Filtre les prédictions en dessous du seuil d'erreur
        results = [[i, r] for i, r in enumerate(res) if r > error_threshold]
        
        # Trie par probabilité
        results.sort(key=lambda x: x[1], reverse=True)
        
        return_list = []
        for r in results:
            return_list.append({"intent": self.classes[r[0]], "probability": float(r[1])})
        
        return return_list
    
    def _get_user_courses(self, user_id):
        """Récupère les cours de l'utilisateur depuis la base de données"""
        # Si les cours sont en cache et récents (moins de 5 minutes)
        if user_id in self.user_courses_cache:
            cache_time, courses = self.user_courses_cache[user_id]
            if (time.time() - cache_time) < 300:  # 5 minutes
                return courses
        
        try:
            # Faire la requête à l'API des cours
            response = requests.get(
                f"http://localhost:5000/api/courses/user/{user_id}",
                headers={"Authorization": f"Bearer {self.api_token}"}
            )
            if response.status_code == 200:
                courses = response.json().get('data', [])
                # Mettre en cache
                self.user_courses_cache[user_id] = (time.time(), courses)
                return courses
        except Exception as e:
            print(f"Erreur lors de la récupération des cours: {e}")
        return []

    def _search_course(self, query, user_courses=None):
        """Recherche un cours spécifique dans la base de données"""
        try:
            # Nettoyer et préparer la requête
            query_terms = query.lower().split()
            # Supprimer les mots non pertinents
            query_terms = [term for term in query_terms if term not in ['cours', 'formation', 'de', 'en', 'le', 'la', 'les', 'du', 'des', 'et']]
            
            print(f"Termes de recherche après nettoyage: {query_terms}")
            
            # Récupérer tous les cours depuis l'API
            try:
                print("Tentative de récupération des cours depuis l'API...")
                print("Token API:", self.api_token)  # Log du token (à supprimer en production)
                
                # Essayer d'abord avec le port 5000
                try:
                    response = requests.get(
                        "http://localhost:5000/api/courses",
                        headers={
                            "Authorization": f"Bearer {self.api_token}",
                            "Content-Type": "application/json"
                        },
                        timeout=5  # Timeout de 5 secondes
                    )
                except requests.exceptions.RequestException:
                    print("Tentative avec le port 5000 échouée, essai avec le port 3000...")
                    response = requests.get(
                        "http://localhost:3000/api/courses",
                        headers={
                            "Authorization": f"Bearer {self.api_token}",
                            "Content-Type": "application/json"
                        },
                        timeout=5  # Timeout de 5 secondes
                    )
                
                print(f"Statut de la réponse API: {response.status_code}")
                print(f"Contenu de la réponse API: {response.text}")
                
                if response.status_code != 200:
                    print(f"Erreur lors de la récupération des cours: {response.status_code}")
                    print(f"Message d'erreur: {response.text}")
                    # Utiliser des données de test si l'API ne répond pas
                    test_courses = [
                        {
                            "_id": "html-css-course",
                            "title": "HTML et CSS - Les fondamentaux",
                            "description": "Apprenez les bases du développement web avec HTML et CSS",
                            "moduleId": "web-dev"
                        },
                        {
                            "_id": "javascript-course",
                            "title": "JavaScript pour débutants",
                            "description": "Introduction à la programmation JavaScript",
                            "moduleId": "web-dev"
                        }
                    ]
                    print("Utilisation des données de test:", json.dumps(test_courses, indent=2))
                    return self._process_courses(test_courses, query_terms)
                
                response_data = response.json()
                courses = response_data.get('data', [])
                if not courses:  # Si pas de cours trouvés dans l'API
                    print("Aucun cours trouvé dans l'API, utilisation des données de test")
                    test_courses = [
                        {
                            "_id": "html-css-course",
                            "title": "HTML et CSS - Les fondamentaux",
                            "description": "Apprenez les bases du développement web avec HTML et CSS",
                            "moduleId": "web-dev"
                        },
                        {
                            "_id": "javascript-course",
                            "title": "JavaScript pour débutants",
                            "description": "Introduction à la programmation JavaScript",
                            "moduleId": "web-dev"
                        }
                    ]
                    return self._process_courses(test_courses, query_terms)
                
                print(f"Cours récupérés depuis l'API: {len(courses)} cours")
                return self._process_courses(courses, query_terms)
                
            except Exception as e:
                print(f"Erreur lors de la requête API: {e}")
                # Utiliser des données de test en cas d'erreur
                test_courses = [
                    {
                        "_id": "html-css-course",
                        "title": "HTML et CSS - Les fondamentaux",
                        "description": "Apprenez les bases du développement web avec HTML et CSS",
                        "moduleId": "web-dev"
                    },
                    {
                        "_id": "javascript-course",
                        "title": "JavaScript pour débutants",
                        "description": "Introduction à la programmation JavaScript",
                        "moduleId": "web-dev"
                    }
                ]
                print("Utilisation des données de test suite à une erreur")
                return self._process_courses(test_courses, query_terms)
                
        except Exception as e:
            print(f"Erreur lors de la recherche de cours: {e}")
            import traceback
            print(traceback.format_exc())
            return []

    def _process_courses(self, courses, query_terms):
        """Traite et filtre les cours selon les termes de recherche"""
        matching_courses = []
        for course in courses:
            try:
                title = course.get('title', '').lower()
                description = course.get('description', '').lower()
                
                print(f"\nAnalyse du cours: {title}")
                
                # Calculer le score de correspondance
                score = 0
                matches = []
                
                for term in query_terms:
                    term_score = 0
                    if term in title:
                        term_score += 10
                        matches.append(f"titre (+10)")
                    if term in description:
                        term_score += 5
                        matches.append(f"description (+5)")
                    
                    # Bonus pour les technologies spécifiques
                    if term in ['html', 'css', 'javascript', 'python', 'java', 'react']:
                        if term in title:
                            term_score += 20
                            matches.append(f"technologie spécifique (+20)")
                    
                    score += term_score
                    if term_score > 0:
                        print(f"Terme '{term}' trouvé dans: {', '.join(matches)}")
                
                if score > 0:
                    course['match_score'] = score
                    matching_courses.append(course)
                    print(f"Score total pour {title}: {score}")
            except Exception as e:
                print(f"Erreur lors de l'analyse du cours: {e}")
                continue
        
        # Trier par score de correspondance
        matching_courses.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        print(f"\nNombre de cours correspondants trouvés: {len(matching_courses)}")
        if matching_courses:
            print(f"Meilleur résultat: {matching_courses[0]['title']} (score: {matching_courses[0]['match_score']})")
        
        return matching_courses

    def get_response(self, intents_list, intents_json, user_id, user_context=None):
        """Version améliorée de get_response avec gestion des cours"""
        if not intents_list:
            return {
                "text": "Je ne comprends pas. Pourriez-vous reformuler votre question?",
                "action": None
            }
        
        tag = intents_list[0]['intent']
        input_message = intents_list[0].get('input', '').lower()
        
        # Vérifier si le message contient des mots-clés de cours
        course_keywords = ['html', 'css', 'javascript', 'python', 'java', 'react', 'angular', 'nodejs']
        has_course_keywords = any(keyword in input_message for keyword in course_keywords)
        
        if has_course_keywords or tag == "specific_course" or "cours" in input_message:
            # Rechercher le cours
            found_courses = self._search_course(input_message, None)
            
            if found_courses:
                course = found_courses[0]  # Prendre le cours avec le meilleur score
                return {
                    "text": f"Je vous redirige vers le cours : {course['title']}",
                    "action": "redirect_course",
                    "course_data": {
                        "id": course['_id'],
                        "title": course['title'],
                        "url": f"/course/{course['_id']}"  # URL relative
                    },
                    "redirect_url": f"/course/{course['_id']}"  # URL relative
                }
            else:
                return {
                    "text": "Désolé, je n'ai pas trouvé ce cours dans notre plateforme. Vous pouvez consulter notre catalogue de cours pour voir tous les cours disponibles.",
                    "action": None
                }
        
        # Pour les autres intentions
        for intent in intents_json['intents']:
            if intent['tag'] == tag:
                response = self._get_base_response(intent, user_id)
                return {
                    "text": response,
                    "action": None
                }
        
        return {
            "text": "Je ne suis pas sûr de comprendre. Pourriez-vous reformuler votre question?",
            "action": None
        }

    def _get_base_response(self, intent, user_id):
        """Obtient une réponse de base pour une intention"""
        available_responses = [
            resp for resp in intent['responses']
            if resp not in self.response_history[user_id].get(intent['tag'], set())
        ]
        
        if not available_responses:
            self.response_history[user_id][intent['tag']] = set()
            available_responses = intent['responses']
        
        response = random.choice(available_responses)
        self.response_history[user_id][intent['tag']].add(response)
        return response

    def predict(self, message, user_id, user_context=None):
        """Version améliorée de predict avec gestion des cours"""
        try:
            normalized_message = self._normalize_input(message)
            print(f"\nMessage reçu: {message}")
            print(f"Message normalisé: {normalized_message}")
            
            # Vérifier si le message contient des mots-clés de cours
            course_keywords = ['html', 'css', 'javascript', 'python', 'java', 'react', 'angular', 'nodejs']
            message_words = normalized_message.lower().split()
            has_course_keywords = any(keyword in message_words for keyword in course_keywords)
            
            print(f"Contient des mots-clés de cours: {has_course_keywords}")
            
            if has_course_keywords or "cours" in message_words:
                # Rechercher le cours directement
                found_courses = self._search_course(normalized_message, None)
                
                if found_courses:
                    course = found_courses[0]
                    print(f"Cours trouvé: {course['title']}")
                    
                    # Créer l'URL complète pour le frontend
                    course_url = f"/courses/{course['_id']}"  # URL pour le frontend React
                    
                    return {
                        "response": f"Je vous redirige vers le cours : {course['title']}",
                        "confidence": 1.0,
                        "intent": "specific_course",
                        "action": "redirect_course",
                        "shouldRedirect": True,
                        "course_data": {
                            "id": course['_id'],
                            "title": course['title'],
                            "url": course_url,
                            "moduleId": course.get('moduleId')
                        },
                        "redirect_url": course_url,
                        "redirect_data": {
                            "url": course_url,
                            "courseId": course['_id'],
                            "courseTitle": course['title'],
                            "moduleId": course.get('moduleId')
                        }
                    }
            
            # Si aucun cours n'est trouvé ou pas de mots-clés de cours, continuer avec la prédiction normale
            ints = self.predict_class(message)
            if ints:
                ints[0]['input'] = message
            
            response_data = self.get_response(ints, self.intents, user_id, user_context)
            
            # Construire la réponse finale
            final_response = {
                "response": response_data.get("text", "Je ne comprends pas votre demande."),
                "confidence": ints[0]['probability'] if ints else 0,
                "intent": ints[0]['intent'] if ints else "unknown",
                "action": response_data.get("action"),
                "shouldRedirect": False,
                "conversation_history": self.conversation_history[user_id]
            }

            return final_response
            
        except Exception as e:
            print(f"Erreur dans predict: {e}")
            import traceback
            print(traceback.format_exc())
            return {
                "response": "Désolé, une erreur s'est produite lors du traitement de votre demande.",
                "confidence": 0,
                "intent": "error",
                "action": None,
                "shouldRedirect": False
            }

# Initialiser le prédicteur
predictor = ChatbotPredictor()

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint pour prédire une réponse à partir d'un message"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400
        
        message = data['message']
        user_context = data.get('context', {})
        user_id = user_context.get('userId', 'default_user')
        
        # Récupérer le token d'authentification
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            predictor.set_api_token(token)
        else:
            print("Avertissement: Pas de token d'authentification fourni")
        
        # Prédire la réponse
        result = predictor.predict(message, user_id, user_context)
        
        # Formater la réponse pour le frontend
        response = {
            "success": True,
            "data": {
                "response": result.get("response"),
                "action": result.get("action"),
                "shouldRedirect": result.get("shouldRedirect", False),
                "course_data": result.get("course_data"),
                "redirect_data": result.get("redirect_data"),
                "redirect_url": result.get("redirect_url"),
                "confidence": result.get("confidence"),
                "intent": result.get("intent"),
                "conversation_history": result.get("conversation_history", [])
            }
        }
        
        print("Réponse envoyée:", json.dumps(response, indent=2))  # Log de débogage plus lisible
        
        return jsonify(response)
    except Exception as e:
        print(f"Erreur lors du traitement de la requête: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "Une erreur s'est produite lors du traitement de votre demande.",
            "details": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de vérification de santé de l'API"""
    model_status = "loaded" if predictor.model else "not_loaded"
    return jsonify({
        "status": "healthy",
        "model_status": model_status,
        "num_intents": len(predictor.intents['intents']) if 'intents' in predictor.intents else 0
    })

if __name__ == '__main__':
    # Créer le dossier des modèles s'il n'existe pas
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../models'), exist_ok=True)
    # Lire les arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Adresse IP du serveur Flask')
    parser.add_argument('--port', type=int, default=5001, help='Port du serveur Flask')
    args = parser.parse_args()

    # Démarrer Flask avec les paramètres donnés
    app.run(host=args.host, port=args.port, debug=False)
    
    # Démarrer le serveur Flask
    app.run(host='0.0.0.0', port=5000, debug=False)
