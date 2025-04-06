import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
import nltk
from nltk.stem import WordNetLemmatizer
import pickle
import random
import os

# Télécharger les ressources NLTK nécessaires
nltk.download('punkt')
nltk.download('wordnet')

class ChatbotModelTrainer:
    def __init__(self, intents_file='intents.json', model_name='chatbot_model'):
        # Chemin du dossier des modèles
        self.models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../models')
        os.makedirs(self.models_dir, exist_ok=True)
        
        self.intents_file = intents_file
        self.model_name = model_name
        self.lemmatizer = WordNetLemmatizer()
        self.words = []
        self.classes = []
        self.documents = []
        self.ignore_letters = ['?', '!', '.', ',']
        self.model = None
        
        # Charge le fichier d'intentions
        try:
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), intents_file), 'r', encoding='utf-8') as f:
                self.intents = json.load(f)
        except FileNotFoundError:
            print(f"Le fichier {intents_file} n'a pas été trouvé. Création d'un fichier d'intentions par défaut.")
            self.create_default_intents()
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), intents_file), 'r', encoding='utf-8') as f:
                self.intents = json.load(f)

    def create_default_intents(self):
        """Crée un fichier d'intentions par défaut si aucun n'est trouvé"""
        default_intents = {
            "intents": [
                {
                    "tag": "salutation",
                    "patterns": [
                        "Bonjour",
                        "Salut",
                        "Hey",
                        "Hello",
                        "Coucou"
                    ],
                    "responses": [
                        "Bonjour! Comment puis-je vous aider avec nos cours?",
                        "Salut! Que puis-je faire pour vous aujourd'hui?",
                        "Bonjour! En quoi puis-je vous être utile pour votre apprentissage?"
                    ],
                    "context": []
                },
                {
                    "tag": "au_revoir",
                    "patterns": [
                        "Au revoir",
                        "A plus tard",
                        "A bientôt",
                        "Bye"
                    ],
                    "responses": [
                        "Au revoir! N'hésitez pas à revenir si vous avez d'autres questions.",
                        "À bientôt! Bon apprentissage!",
                        "Au revoir et bonne continuation dans vos études!"
                    ],
                    "context": []
                },
                {
                    "tag": "merci",
                    "patterns": [
                        "Merci",
                        "Je vous remercie",
                        "C'est gentil",
                        "Merci beaucoup"
                    ],
                    "responses": [
                        "De rien!",
                        "C'est un plaisir de vous aider!",
                        "N'hésitez pas si vous avez d'autres questions."
                    ],
                    "context": []
                },
                {
                    "tag": "cours",
                    "patterns": [
                        "Quels cours proposez-vous?",
                        "Montrez-moi les cours disponibles",
                        "Liste des cours",
                        "Formations disponibles"
                    ],
                    "responses": [
                        "Nous proposons des cours sur le développement web, la data science, l'IA et plus encore. Consultez notre catalogue pour plus de détails.",
                        "Notre plateforme offre une variété de cours techniques, de la programmation à l'IA. Vous pouvez filtrer par catégorie sur notre page de cours."
                    ],
                    "context": []
                },
                {
                    "tag": "prix",
                    "patterns": [
                        "Combien coûtent vos cours?",
                        "Prix des formations",
                        "Tarifs",
                        "Est-ce gratuit?"
                    ],
                    "responses": [
                        "Nos prix varient selon les cours. Certains modules sont gratuits, d'autres sont payants. Consultez chaque cours pour plus de détails.",
                        "Nous avons des cours gratuits et des formations premium. Les prix sont indiqués sur chaque page de cours."
                    ],
                    "context": []
                },
                {
                    "tag": "compte",
                    "patterns": [
                        "Comment créer un compte?",
                        "Inscription",
                        "S'enregistrer",
                        "Créer un profil"
                    ],
                    "responses": [
                        "Vous pouvez créer un compte en cliquant sur 'S'inscrire' en haut à droite de la page d'accueil.",
                        "L'inscription est simple, cliquez sur le bouton 'S'inscrire' et suivez les instructions."
                    ],
                    "context": []
                },
                {
                    "tag": "aide",
                    "patterns": [
                        "J'ai besoin d'aide",
                        "Pouvez-vous m'aider",
                        "Je suis perdu",
                        "Comment ça marche"
                    ],
                    "responses": [
                        "Bien sûr, je suis là pour vous aider! Quel aspect de notre plateforme vous pose problème?",
                        "Je serais ravi de vous aider. Pourriez-vous préciser votre question?"
                    ],
                    "context": []
                },
                {
                    "tag": "certificat",
                    "patterns": [
                        "Obtenez-vous un certificat",
                        "Y a-t-il une certification",
                        "Les cours sont-ils certifiés",
                        "Diplôme"
                    ],
                    "responses": [
                        "Oui, vous recevrez un certificat après avoir terminé avec succès chaque cours.",
                        "Nos cours incluent une certification que vous pouvez partager sur votre CV ou LinkedIn."
                    ],
                    "context": []
                }
            ]
        }
        
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'intents.json'), 'w', encoding='utf-8') as f:
            json.dump(default_intents, f, indent=4, ensure_ascii=False)
        
        print("Fichier d'intentions par défaut créé avec succès.")
    
    def preprocess_data(self):
        """Prétraite les données d'entraînement à partir du fichier d'intentions"""
        for intent in self.intents['intents']:
            for pattern in intent['patterns']:
                # Tokenize chaque pattern
                word_list = nltk.word_tokenize(pattern.lower())
                self.words.extend(word_list)
                # Ajoute à la liste des documents
                self.documents.append((word_list, intent['tag']))
                # Ajoute à la liste des classes
                if intent['tag'] not in self.classes:
                    self.classes.append(intent['tag'])
        
        # Lemmatisation et filtrage des mots
        self.words = [self.lemmatizer.lemmatize(word) for word in self.words if word not in self.ignore_letters]
        self.words = sorted(list(set(self.words)))
        self.classes = sorted(list(set(self.classes)))
        
        print(f"{len(self.documents)} documents")
        print(f"{len(self.classes)} classes: {self.classes}")
        print(f"{len(self.words)} mots uniques lemmatisés: {self.words}")
        
        # Sauvegarde des mots et classes pour une utilisation ultérieure
        pickle.dump(self.words, open(os.path.join(self.models_dir, f'{self.model_name}_words.pkl'), 'wb'))
        pickle.dump(self.classes, open(os.path.join(self.models_dir, f'{self.model_name}_classes.pkl'), 'wb'))
    
    def create_training_data(self):
        """Crée les données d'entraînement pour le modèle"""
        training = []
        output_empty = [0] * len(self.classes)
        
        for document in self.documents:
            bag = []
            word_patterns = document[0]
            word_patterns = [self.lemmatizer.lemmatize(word.lower()) for word in word_patterns]
            
            for word in self.words:
                bag.append(1) if word in word_patterns else bag.append(0)
            
            output_row = list(output_empty)
            output_row[self.classes.index(document[1])] = 1
            
            training.append([bag, output_row])
        
        # Mélange les données d'entraînement
        random.shuffle(training)
        training = np.array(training, dtype=object)
        
        # Sépare les features et les labels
        train_x = np.array([np.array(item[0]) for item in training])
        train_y = np.array([np.array(item[1]) for item in training])
        
        return train_x, train_y
    
    def build_model(self):
        """Construit et compile le modèle de réseau de neurones"""
        self.model = Sequential()
        self.model.add(Dense(128, input_shape=(len(self.words),), activation='relu'))
        self.model.add(Dropout(0.5))
        self.model.add(Dense(64, activation='relu'))
        self.model.add(Dropout(0.5))
        self.model.add(Dense(len(self.classes), activation='softmax'))
        
        # Compilation du modèle
        adam = Adam(learning_rate=0.01, decay=1e-6)
        self.model.compile(loss='categorical_crossentropy', optimizer=adam, metrics=['accuracy'])
        
        return self.model
    
    def train_model(self, epochs=200, batch_size=5, verbose=1):
        """Entraîne le modèle sur les données prétraitées"""
        if not self.words or not self.classes:
            self.preprocess_data()
        
        train_x, train_y = self.create_training_data()
        
        if not self.model:
            self.build_model()
        
        # Entraînement du modèle
        history = self.model.fit(
            train_x, train_y,
            epochs=epochs,
            batch_size=batch_size,
            verbose=verbose
        )
        
        # Sauvegarde du modèle
        self.model.save(os.path.join(self.models_dir, f'{self.model_name}.h5'))
        print(f"Modèle sauvegardé sous {os.path.join(self.models_dir, self.model_name)}.h5")
        
        return history
    
    def evaluate_model(self, test_size=0.2):
        """Évalue le modèle sur un ensemble de test"""
        if not self.words or not self.classes:
            self.preprocess_data()
        
        train_x, train_y = self.create_training_data()
        
        # Séparation des données d'entraînement et de test
        split_idx = int(len(train_x) * (1 - test_size))
        x_train, x_test = train_x[:split_idx], train_x[split_idx:]
        y_train, y_test = train_y[:split_idx], train_y[split_idx:]
        
        if not self.model:
            # Charger le modèle si nécessaire
            try:
                self.model = tf.keras.models.load_model(os.path.join(self.models_dir, f'{self.model_name}.h5'))
            except:
                print("Aucun modèle trouvé. Entraînez le modèle d'abord.")
                return None
        
        # Évaluation du modèle
        scores = self.model.evaluate(x_test, y_test, verbose=0)
        print(f"Précision du modèle: {scores[1]*100:.2f}%")
        
        return scores

if __name__ == "__main__":
    trainer = ChatbotModelTrainer()
    trainer.preprocess_data()
    trainer.train_model(epochs=200, verbose=1)
    trainer.evaluate_model()
    print("Entraînement du modèle terminé avec succès!")
