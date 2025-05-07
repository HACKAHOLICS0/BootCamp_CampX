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
        self.response_history = defaultdict(list)  # Historique des réponses par utilisateur
        self.last_responses = defaultdict(str)    # Dernière réponse par utilisateur

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
            query = query.lower().strip()
            query_terms = query.split()
            # Supprimer les mots non pertinents
            stop_words = ['cours', 'formation', 'de', 'en', 'le', 'la', 'les', 'du', 'des', 'et', 'sur', 'je', 'veux', 'voir', 'accéder', 'aller']
            query_terms = [term for term in query_terms if term not in stop_words]

            print(f"Termes de recherche après nettoyage: {query_terms}")

            try:
                # Récupérer tous les cours depuis l'API
                response = requests.get(
                    "http://localhost:5000/api/courses",
                    headers={
                        "Authorization": f"Bearer {self.api_token}",
                        "Content-Type": "application/json"
                    }
                )

                print(f"Réponse API brute: {response.text}")  # Debug

                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        courses = []

                        # Traiter la réponse selon sa structure
                        if isinstance(response_data, list):
                            courses = response_data
                        elif isinstance(response_data, dict):
                            if 'data' in response_data:
                                if isinstance(response_data['data'], list):
                                    courses = response_data['data']
                                else:
                                    courses = [response_data['data']]
                            else:
                                courses = [response_data]

                        print(f"Nombre de cours trouvés: {len(courses)}")
                        print(f"Structure des cours: {courses[:1]}")  # Debug

                        # Rechercher le meilleur match
                        best_match = None
                        highest_score = 0

                        for course in courses:
                            if not isinstance(course, dict):
                                print(f"Course invalide: {course}")
                                continue

                            # Calculer un score de correspondance
                            score = 0
                            course_title = str(course.get('title', '')).lower()
                            course_description = str(course.get('description', '')).lower()

                            # Vérifier chaque terme de recherche
                            for term in query_terms:
                                if term in course_title:
                                    score += 2  # Score plus élevé pour les correspondances dans le titre
                                if term in course_description:
                                    score += 1

                            # Mettre à jour le meilleur match si nécessaire
                            if score > highest_score:
                                highest_score = score
                                best_match = course

                        if best_match and highest_score > 0:
                            print(f"Meilleur cours trouvé: {best_match.get('title')} (score: {highest_score})")

                            # Extraire les IDs de catégorie et de module
                            module_id = best_match.get('module', {}).get('_id')
                            category_id = best_match.get('category', {}).get('_id')

                            # Si l'ID de catégorie n'est pas directement dans le cours, le récupérer depuis le module
                            if not category_id and module_id:
                                try:
                                    module_response = requests.get(
                                        f"http://localhost:5000/api/modules/{module_id}",
                                        headers={
                                            "Authorization": f"Bearer {self.api_token}",
                                            "Content-Type": "application/json"
                                        }
                                    )
                                    if module_response.status_code == 200:
                                        module_data = module_response.json()
                                        category_id = module_data.get('category', {}).get('_id')
                                except Exception as e:
                                    print(f"Erreur lors de la récupération des données du module: {e}")

                            print(f"IDs extraits - Category: {category_id}, Module: {module_id}")

                            return {
                                "found": True,
                                "course": best_match,
                                "action": "redirect_course",
                                "shouldRedirect": True,
                                "response": f"J'ai trouvé le cours '{best_match.get('title')}'. Je vous y emmène !",
                                "redirect_data": {
                                    "courseId": best_match.get('_id'),
                                    "title": best_match.get('title'),
                                    "categoryId": category_id,
                                    "moduleId": module_id
                                }
                            }
                        else:
                            print("Aucun cours correspondant trouvé")
                            return {
                                "found": False,
                                "response": "Désolé, je n'ai pas trouvé de cours correspondant à votre recherche."
                            }
                    except json.JSONDecodeError as e:
                        print(f"Erreur de décodage JSON: {e}")
                        return {
                            "found": False,
                            "response": "Désolé, il y a eu une erreur lors de la lecture des cours."
                        }
                else:
                    print(f"Erreur API: {response.status_code}")
                    return {
                        "found": False,
                        "response": "Désolé, je n'arrive pas à accéder aux cours pour le moment."
                    }

            except requests.exceptions.RequestException as e:
                print(f"Erreur de requête: {e}")
                return {
                    "found": False,
                    "response": "Désolé, je n'arrive pas à accéder aux cours pour le moment."
                }

        except Exception as e:
            print(f"Erreur lors de la recherche de cours: {e}")
            import traceback
            print(traceback.format_exc())
            return {
                "found": False,
                "response": "Une erreur s'est produite lors de la recherche du cours."
            }

    def _get_unique_response(self, responses, user_id):
        """Retourne une réponse unique qui n'a pas été utilisée récemment"""
        if not responses:
            return "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?"

        # Filtrer les réponses qui n'ont pas été utilisées récemment
        available_responses = [r for r in responses if r != self.last_responses[user_id]]

        if not available_responses:
            # Si toutes les réponses ont été utilisées, réinitialiser l'historique
            self.response_history[user_id] = []
            available_responses = responses

        # Choisir une réponse aléatoire parmi celles disponibles
        response = random.choice(available_responses)

        # Mettre à jour l'historique
        self.last_responses[user_id] = response
        self.response_history[user_id].append(response)

        # Limiter la taille de l'historique à 5 réponses
        if len(self.response_history[user_id]) > 5:
            self.response_history[user_id].pop(0)

        return response

    def get_response(self, message, user_id=None):
        """Génère une réponse en fonction du message de l'utilisateur"""
        # Normaliser l'entrée
        message = self._normalize_input(message)

        # Prédire l'intention
        ints = self.predict_class(message)
        if not ints:
            return {
                "response": "Je ne comprends pas votre demande.",
                "action": None
            }

        intent = ints[0]["intent"]
        print(f"Intention détectée: {intent}")

        # Si l'intention est de chercher un cours
        if intent in ["search_course", "course_info", "unknown"]:
            # Rechercher le cours
            search_result = self._search_course(message)
            if search_result["found"]:
                return search_result

        # Pour les autres intentions, continuer avec le traitement normal
        for intent_data in self.intents["intents"]:
            if intent_data["tag"] == intent:
                response = self._get_unique_response(intent_data["responses"], user_id)
                return {
                    "response": response,
                    "action": intent_data.get("action"),
                    "data": intent_data.get("data")
                }

        return {
            "response": "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?",
            "action": None
        }

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
                search_result = self._search_course(normalized_message)

                if search_result and search_result.get("found"):
                    course = search_result.get("course")
                    print(f"Cours trouvé: {course.get('title')}")

                    # Créer l'URL complète pour le frontend
                    module_id = course.get('module', {}).get('_id')
                    category_id = course.get('category', {}).get('_id')

                    # Si l'ID de catégorie n'est pas directement dans le cours, le récupérer depuis le module
                    if not category_id and module_id:
                        try:
                            module_response = requests.get(
                                f"http://localhost:5000/api/modules/{module_id}",
                                headers={
                                    "Authorization": f"Bearer {self.api_token}",
                                    "Content-Type": "application/json"
                                }
                            )
                            if module_response.status_code == 200:
                                module_data = module_response.json()
                                category_id = module_data.get('category', {}).get('_id')
                        except Exception as e:
                            print(f"Erreur lors de la récupération des données du module: {e}")

                    print(f"IDs extraits - Category: {category_id}, Module: {module_id}")
                    course_url = f"/categories/{category_id}/modules/{module_id}/courses/{course.get('_id')}"

                    return {
                        "response": search_result.get("response", "J'ai trouvé votre cours !"),
                        "confidence": 1.0,
                        "intent": "specific_course",
                        "action": search_result.get("action"),
                        "shouldRedirect": search_result.get("shouldRedirect", True),
                        "course_data": {
                            "id": course.get('_id'),
                            "title": course.get('title'),
                            "url": course_url,
                            "moduleId": module_id,
                            "categoryId": category_id
                        },
                        "redirect_url": course_url,
                        "redirect_data": {
                            "courseId": course.get('_id'),
                            "title": course.get('title'),
                            "categoryId": category_id,
                            "moduleId": module_id
                        }
                    }
                else:
                    return {
                        "response": search_result.get("response", "Je n'ai pas trouvé de cours correspondant à votre recherche."),
                        "confidence": 0.5,
                        "intent": "search_course",
                        "action": None,
                        "shouldRedirect": False
                    }

            # Si aucun cours n'est trouvé ou pas de mots-clés de cours, continuer avec la prédiction normale
            response_data = self.get_response(message)

            # Construire la réponse finale
            final_response = {
                "response": response_data.get("response", "Je ne comprends pas votre demande."),
                "confidence": 0,
                "intent": "unknown",
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
            print(f"Token d'authentification reçu: {token[:10]}...")
        else:
            print("Avertissement: Pas de token d'authentification fourni")
            # Répondre avec un message d'erreur si aucun token n'est fourni
            if not user_id or user_id == 'default_user':
                return jsonify({
                    "success": True,
                    "data": {
                        "response": "Vous devez être connecté pour utiliser le chatbot. Veuillez vous connecter ou créer un compte.",
                        "action": None,
                        "shouldRedirect": False,
                        "intent": "auth_error"
                    }
                })

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
    try:
        # Créer le dossier des modèles s'il n'existe pas
        os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../models'), exist_ok=True)

        # Lire les arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--host', type=str, default='127.0.0.1', help='Adresse IP du serveur Flask')
        parser.add_argument('--port', type=int, default=5001, help='Port du serveur Flask')
        args = parser.parse_args()

        print(f"Démarrage du serveur chatbot sur {args.host}:{args.port}")

        # Démarrer Flask avec les paramètres donnés
        app.run(host=args.host, port=args.port, debug=True)
    except Exception as e:
        print(f"Erreur lors du démarrage du serveur: {e}")
        import traceback
        print(traceback.format_exc())
