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

app = Flask(__name__)
CORS(app)  # Active CORS pour toutes les routes
CORS(app, origins=["http://localhost:5000"])


class ChatbotPredictor:
    def __init__(self, model_name='chatbot_model'):
        # Chemin du dossier des modèles
        self.models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../models')
        self.model_name = model_name
        self.lemmatizer = WordNetLemmatizer()
        
        # Télécharger les ressources NLTK nécessaires
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/wordnet')
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
    
    def _clean_up_sentence(self, sentence):
        """Tokenize et lemmatize une phrase"""
        sentence_words = nltk.word_tokenize(sentence.lower())
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
    
    def get_response(self, intents_list, intents_json):
        """Obtient une réponse basée sur l'intention prédite"""
        if not intents_list:
            return "Je ne comprends pas. Pourriez-vous reformuler votre question?"
        
        tag = intents_list[0]['intent']
        
        if tag == "unknown" or tag == "error":
            return "Je ne suis pas sûr de comprendre. Pourriez-vous reformuler votre question?"
        
        # Recherche dans le fichier d'intentions
        for intent in intents_json['intents']:
            if intent['tag'] == tag:
                # Sélectionne une réponse aléatoire
                import random
                response = random.choice(intent['responses'])
                return response
        
        return "Je ne suis pas sûr de comprendre. Pourriez-vous reformuler votre question?"
    
    def predict(self, message):
        """Prédit une réponse à partir d'un message"""
        ints = self.predict_class(message)
        res = self.get_response(ints, self.intents)
        
        # Ajoute des informations supplémentaires à la réponse
        return {
            "response": res,
            "confidence": ints[0]['probability'] if ints else 0,
            "intent": ints[0]['intent'] if ints else "unknown",
            "all_intents": ints
        }

# Initialiser le prédicteur
predictor = ChatbotPredictor()

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint pour prédire une réponse à partir d'un message"""
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
    
    message = data['message']
    user_context = data.get('context', {})
    
    # Prédire la réponse
    result = predictor.predict(message)
    
    # Ajouter le contexte à la réponse
    result['user_context'] = user_context
    
    return jsonify(result)

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
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Adresse IP du serveur Flask')
    parser.add_argument('--port', type=int, default=5000, help='Port du serveur Flask')
    args = parser.parse_args()

    # Démarrer Flask avec les paramètres donnés
    app.run(host=args.host, port=args.port, debug=False)
    
    # Démarrer le serveur Flask
    app.run(host='0.0.0.0', port=5000, debug=False)
