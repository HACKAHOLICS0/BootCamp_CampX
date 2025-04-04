import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.tokenize import RegexpTokenizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import sys
import json

class QuestionGenerator:
    def __init__(self):
        # Télécharger les ressources NLTK nécessaires
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('punkt')
            nltk.download('stopwords')
        
        self.stop_words = set(stopwords.words('french'))
        self.tokenizer = RegexpTokenizer(r'\w+')
        self.question_templates = [
            "Quelle est la principale notion abordée dans ce passage ?",
            "Que pouvez-vous dire sur le contenu de ce passage ?",
            "Quel est le sujet principal abordé ici ?",
            "Quelle est l'information principale de ce passage ?",
            "Que retenez-vous de ce passage ?"
        ]

    def preprocess_text(self, text):
        # Nettoyer et tokenizer le texte
        text = text.lower()
        tokens = self.tokenizer.tokenize(text)
        tokens = [t for t in tokens if t not in self.stop_words and len(t) > 2]
        return tokens

    def extract_key_sentences(self, text, num_sentences=3):
        # Diviser en phrases
        sentences = sent_tokenize(text)
        if not sentences:
            return []

        # Calculer TF-IDF pour trouver les phrases les plus importantes
        vectorizer = TfidfVectorizer(stop_words=list(self.stop_words))
        try:
            tfidf_matrix = vectorizer.fit_transform(sentences)
            sentence_scores = np.sum(tfidf_matrix.toarray(), axis=1)
            top_sentence_indices = sentence_scores.argsort()[-num_sentences:][::-1]
            return [sentences[i] for i in top_sentence_indices]
        except:
            return [sentences[0]] if sentences else []

    def generate_options(self, correct_sentence, all_sentences):
        options = [correct_sentence]
        
        # Utiliser d'autres phrases comme distracteurs
        other_sentences = [s for s in all_sentences if s != correct_sentence]
        if len(other_sentences) >= 3:
            options.extend(np.random.choice(other_sentences, 3, replace=False))
        else:
            # Si pas assez de phrases, créer des options génériques
            generic_options = [
                "Cette information n'est pas mentionnée dans le passage",
                "Aucune de ces réponses",
                "Le passage ne permet pas de répondre à cette question"
            ]
            options.extend(generic_options[:4-len(options)])
        
        np.random.shuffle(options)
        return options

    def generate_question(self, text_segment):
        if not text_segment or len(text_segment.strip()) < 10:
            return None

        # Extraire les phrases clés
        key_sentences = self.extract_key_sentences(text_segment)
        if not key_sentences:
            return None

        # Choisir une phrase comme réponse correcte
        correct_answer = key_sentences[0]
        
        # Générer une question
        question = np.random.choice(self.question_templates)

        # Générer les options
        options = self.generate_options(correct_answer, sent_tokenize(text_segment))

        return {
            "question": question,
            "options": options,
            "correct_answer": correct_answer
        }

    def generate_questions_from_transcript(self, transcript, num_questions=1):
        questions = []
        segments = self.split_transcript(transcript)
        
        for segment in segments:
            question = self.generate_question(segment)
            if question:
                questions.append(question)
                if len(questions) >= num_questions:
                    break
        
        return questions

    def split_transcript(self, transcript, segment_length=500):
        # Diviser la transcription en segments
        sentences = sent_tokenize(transcript)
        segments = []
        current_segment = []
        current_length = 0
        
        for sentence in sentences:
            current_length += len(sentence.split())
            current_segment.append(sentence)
            
            if current_length >= segment_length:
                segments.append(' '.join(current_segment))
                current_segment = []
                current_length = 0
        
        if current_segment:
            segments.append(' '.join(current_segment))
        
        return segments

if __name__ == "__main__":
    # Lire la transcription depuis les arguments
    if len(sys.argv) > 1:
        transcript = sys.argv[1]
        
        # Créer une instance du générateur
        generator = QuestionGenerator()
        
        # Générer une question
        questions = generator.generate_questions_from_transcript(transcript)
        
        # Convertir en JSON et imprimer
        print(json.dumps(questions)) 