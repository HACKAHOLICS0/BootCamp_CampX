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

        # Stocker le sujet actuel de la vidéo
        self.current_topic = None

        # Templates de questions plus variés et spécifiques
        self.concept_templates = [
            "Quel concept est expliqué ici ?",
            "Quelle notion est présentée dans ce passage ?",
            "Quel est le sujet principal abordé ?"
        ]

        self.definition_templates = [
            "Que signifie {keyword} ?",
            "Comment définit-on {keyword} ?",
            "Qu'est-ce que {keyword} ?"
        ]

        self.application_templates = [
            "Comment utilise-t-on {keyword} ?",
            "À quoi sert {keyword} ?",
            "Dans quel cas utiliser {keyword} ?"
        ]

        self.comparison_templates = [
            "Qu'est-ce qui distingue {keyword1} de {keyword2} ?",
            "Quelle différence entre {keyword1} et {keyword2} ?",
            "Comment comparer {keyword1} et {keyword2} ?"
        ]

        # Templates spécifiques à JavaScript
        self.js_templates = [
            "Qu'est-ce qui distingue {keyword} en JavaScript ?",
            "Comment déclarer {keyword} en JavaScript ?",
            "Quel est le rôle de {keyword} en JavaScript ?"
        ]

        # Dictionnaire de domaines pour la détection de sujets
        self.domain_keywords = {
            'html': ['html', 'balise', 'tag', 'markup', 'document', 'structure', 'web', 'page', 'div', 'span', 'p', 'h1', 'h2', 'body', 'head'],
            'css': ['css', 'style', 'stylesheet', 'design', 'layout', 'responsive', 'flexbox', 'grid', 'color', 'margin', 'padding', 'position', 'display', 'selector'],
            'javascript': ['javascript', 'js', 'function', 'variable', 'const', 'let', 'var', 'array', 'object', 'event', 'callback', 'promise', 'async', 'dom'],
            'sql': ['sql', 'mysql', 'database', 'base de données', 'requête', 'query', 'select', 'insert', 'update', 'delete', 'from', 'where', 'join', 'table', 'colonne', 'ligne', 'primary key', 'foreign key', 'index', 'constraint'],
            'programmation': ['algorithme', 'fonction', 'variable', 'boucle', 'condition', 'classe', 'objet', 'héritage', 'interface', 'type', 'compilation']
        }

        # Templates spécifiques à SQL
        self.sql_templates = [
            "Quel est le rôle de {keyword} en SQL ?",
            "Comment utiliser {keyword} dans une requête SQL ?",
            "À quoi sert la clause {keyword} en SQL ?",
            "Quelle est la fonction de {keyword} dans MySQL ?"
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

    def extract_keywords(self, text, num_keywords=5):
        """Extraire les mots-clés les plus importants du texte"""
        # Nettoyer et tokenizer le texte
        tokens = self.preprocess_text(text)
        if not tokens:
            return []

        # Calculer la fréquence des mots
        word_freq = {}
        for token in tokens:
            if token in word_freq:
                word_freq[token] += 1
            else:
                word_freq[token] = 1

        # Trier par fréquence et prendre les plus fréquents
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:num_keywords]]

    def detect_domain(self, text):
        """Détecter le domaine principal du texte"""
        text_lower = text.lower()
        domain_scores = {}

        for domain, keywords in self.domain_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            domain_scores[domain] = score

        # Trouver le domaine avec le score le plus élevé
        if not domain_scores:
            return 'general'

        max_domain = max(domain_scores.items(), key=lambda x: x[1])

        # Si aucun mot-clé de domaine n'est trouvé, retourner 'general'
        if max_domain[1] == 0:
            return 'general'

        return max_domain[0]

    def extract_short_answer(self, sentence, max_length=50):
        """Générer une réponse courte et bien formulée à partir d'une phrase"""
        # Vérifier si nous avons une question sur "Où écrire le code JavaScript"
        if hasattr(self, 'current_topic') and self.current_topic:
            topic_lower = self.current_topic.lower()
            if ("où écrire" in topic_lower or "ou ecrire" in topic_lower) and "javascript" in topic_lower:
                # Retourner une réponse prédéfinie plutôt qu'une phrase de la transcription
                if "head" in sentence.lower() or "tête" in sentence.lower():
                    return "Dans la section <head> du document HTML"
                elif "body" in sentence.lower() or "corps" in sentence.lower() or "fin" in sentence.lower():
                    return "Juste avant la fermeture de la balise </body>"
                elif "externe" in sentence.lower() or "fichier" in sentence.lower() or ".js" in sentence.lower():
                    return "Dans un fichier externe avec l'extension .js"
                elif "attribut" in sentence.lower() or "onclick" in sentence.lower() or "événement" in sentence.lower():
                    return "Dans les attributs d'événements HTML"
                else:
                    # Réponse par défaut pour ce sujet
                    return "Juste avant la fermeture de la balise </body>"

        # Vérifier si nous avons une question sur le rôle du JavaScript
        if hasattr(self, 'js_role_question') and self.js_role_question:
            # Retourner une réponse prédéfinie plutôt qu'une phrase de la transcription
            if "interactif" in sentence.lower() or "interactivité" in sentence.lower():
                return "Ajouter de l'interactivité aux pages web"
            elif "animation" in sentence.lower() or "visuel" in sentence.lower() or "effet" in sentence.lower():
                return "Créer des animations et effets visuels"
            elif "dom" in sentence.lower() or "manipul" in sentence.lower() or "html" in sentence.lower():
                return "Manipuler le contenu HTML dynamiquement"
            elif "serveur" in sentence.lower() or "ajax" in sentence.lower() or "api" in sentence.lower():
                return "Communiquer avec des serveurs web"
            elif "formulaire" in sentence.lower() or "valid" in sentence.lower() or "donnée" in sentence.lower():
                return "Valider les données des formulaires"
            else:
                # Réponse par défaut pour ce sujet
                return "Ajouter de l'interactivité aux pages web"

        # Extraire les mots-clés importants de la phrase
        keywords = self.extract_keywords(sentence)

        # Déterminer le domaine pour générer une réponse adaptée
        domain = self.detect_domain(sentence)

        # Analyser la structure de la phrase pour déterminer le type de réponse à générer
        sentence_lower = sentence.lower()

        # Détecter les termes techniques dans la phrase
        technical_terms = []
        if keywords:
            technical_terms = keywords

        # Générer une réponse basée sur les termes techniques et le contexte
        if technical_terms and len(technical_terms) >= 1:
            main_term = technical_terms[0]

            # Détecter le type de question pour adapter la réponse
            if "comment" in sentence_lower or "comment" in self.current_topic.lower() if hasattr(self, 'current_topic') and self.current_topic else False:
                # Question de type "Comment..."
                response_templates = [
                    f"En utilisant {main_term} de manière appropriée",
                    f"Par l'application correcte de {main_term}",
                    f"En implémentant {main_term} selon les bonnes pratiques",
                    f"Grâce à une utilisation efficace de {main_term}"
                ]
                if len(technical_terms) >= 2:
                    response_templates.extend([
                        f"En combinant {main_term} avec {technical_terms[1]}",
                        f"En utilisant {main_term} conjointement avec {technical_terms[1]}"
                    ])
                return np.random.choice(response_templates)

            elif "pourquoi" in sentence_lower or "pourquoi" in self.current_topic.lower() if hasattr(self, 'current_topic') and self.current_topic else False:
                # Question de type "Pourquoi..."
                response_templates = [
                    f"Car {main_term} est essentiel pour optimiser les performances",
                    f"Parce que {main_term} permet d'améliorer la qualité du résultat",
                    f"En raison de l'importance de {main_term} dans ce contexte",
                    f"Pour garantir la fiabilité grâce à {main_term}"
                ]
                return np.random.choice(response_templates)

            elif "qu'est-ce" in sentence_lower or "qu'est-ce" in self.current_topic.lower() if hasattr(self, 'current_topic') and self.current_topic else False:
                # Question de type "Qu'est-ce que..."
                response_templates = [
                    f"Un concept fondamental basé sur {main_term}",
                    f"Une technique qui utilise {main_term} pour résoudre des problèmes",
                    f"Un principe qui s'appuie sur {main_term}",
                    f"Une approche centrée sur {main_term}"
                ]
                return np.random.choice(response_templates)

            elif "quel" in sentence_lower or "quelle" in sentence_lower:
                # Question de type "Quel/Quelle..."
                response_templates = [
                    f"L'élément {main_term} qui joue un rôle central",
                    f"Le concept de {main_term} appliqué correctement",
                    f"La technique utilisant {main_term} de façon optimale",
                    f"L'approche basée sur {main_term}"
                ]
                return np.random.choice(response_templates)

            else:
                # Autres types de questions
                if domain == 'html':
                    return f"La balise ou l'élément {main_term} en HTML"
                elif domain == 'css':
                    return f"La propriété ou le sélecteur {main_term} en CSS"
                elif domain == 'javascript':
                    return f"La fonction ou méthode {main_term} en JavaScript"
                elif domain == 'programmation':
                    return f"Le concept de {main_term} en programmation"
                else:
                    # Réponse générique basée sur le terme principal
                    response_templates = [
                        f"Le principe de {main_term} appliqué dans ce contexte",
                        f"L'utilisation appropriée de {main_term}",
                        f"La mise en œuvre efficace de {main_term}",
                        f"L'application correcte de {main_term}"
                    ]
                    return np.random.choice(response_templates)

        # Si aucun terme technique n'est trouvé, utiliser des réponses génériques par domaine
        domain_answers = {
            'html': [
                "La structure sémantique du document HTML",
                "L'organisation hiérarchique des éléments HTML",
                "L'utilisation appropriée des balises HTML",
                "La structure fondamentale d'une page web"
            ],
            'css': [
                "L'application correcte des styles CSS",
                "La mise en forme efficace des éléments web",
                "L'utilisation des sélecteurs CSS appropriés",
                "Le positionnement optimal des éléments"
            ],
            'javascript': [
                "L'implémentation efficace des fonctions JavaScript",
                "La manipulation dynamique du contenu web",
                "La gestion appropriée des événements utilisateur",
                "L'utilisation optimale des structures de données"
            ],
            'programmation': [
                "L'application des principes fondamentaux de programmation",
                "L'utilisation efficace des structures de contrôle",
                "L'implémentation correcte des algorithmes",
                "L'organisation optimale du code source"
            ],
            'general': [
                "Le concept fondamental présenté dans cette section",
                "Le principe essentiel expliqué dans la vidéo",
                "La technique principale démontrée dans ce passage",
                "L'approche méthodique décrite dans cette partie"
            ]
        }

        # Sélectionner une réponse prédéfinie selon le domaine
        if domain in domain_answers:
            answers = domain_answers[domain]
            return answers[np.random.randint(0, len(answers))]

        # Réponse par défaut si aucune approche précédente n'a fonctionné
        return "Le principe fondamental expliqué dans cette section"

    def generate_options(self, correct_answer, domain, keywords=None, all_sentences=None):
        """Générer des options de réponse courtes et pertinentes"""
        # Extraire une réponse courte à partir de la réponse correcte
        short_correct_answer = self.extract_short_answer(correct_answer) if correct_answer else ""

        # Vérifier si nous avons une question spécifique sur "Où écrire le code JavaScript"
        topic = None
        if hasattr(self, 'current_topic'):
            topic = self.current_topic

        if topic and ("où écrire" in topic.lower() or "ou ecrire" in topic.lower()) and "javascript" in topic.lower():
            # Options spécifiques pour "Où écrire le code JavaScript"
            js_location_options = [
                "Dans la section <head> du document HTML",
                "Juste avant la fermeture de la balise </body>",
                "Dans un fichier externe avec l'extension .js",
                "Dans les attributs d'événements HTML"
            ]

            # Définir une réponse correcte fixe qui ne dépend pas de la transcription
            correct_answer = "Juste avant la fermeture de la balise </body>"

            # Mélanger les options pour éviter que la réponse correcte soit toujours à la même position
            np.random.shuffle(js_location_options)
            return js_location_options, correct_answer

        # Vérifier si nous avons une question sur le rôle du JavaScript
        if hasattr(self, 'js_role_question') and self.js_role_question:
            # Options spécifiques pour le rôle du JavaScript
            js_role_options = [
                "Ajouter de l'interactivité aux pages web",
                "Créer des animations et effets visuels",
                "Manipuler le contenu HTML dynamiquement",
                "Communiquer avec des serveurs web"
            ]

            # Définir une réponse correcte fixe
            correct_answer = "Ajouter de l'interactivité aux pages web"

            # Mélanger les options
            np.random.shuffle(js_role_options)
            return js_role_options, correct_answer

        # Vérifier si nous avons une question sur SQL
        if hasattr(self, 'sql_question') and self.sql_question:
            # Déterminer le type de question SQL
            if "select" in correct_answer.lower():
                sql_options = [
                    "La commande SELECT permet d'extraire des données d'une table",
                    "La commande SELECT permet de modifier des données existantes",
                    "La commande SELECT permet d'ajouter de nouvelles lignes",
                    "La commande SELECT permet de supprimer des données"
                ]
                correct_answer = "La commande SELECT permet d'extraire des données d'une table"
            elif "insert" in correct_answer.lower():
                sql_options = [
                    "La commande INSERT permet d'ajouter de nouvelles lignes dans une table",
                    "La commande INSERT permet de modifier des données existantes",
                    "La commande INSERT permet d'extraire des données d'une table",
                    "La commande INSERT permet de supprimer des lignes d'une table"
                ]
                correct_answer = "La commande INSERT permet d'ajouter de nouvelles lignes dans une table"
            elif "update" in correct_answer.lower():
                sql_options = [
                    "La commande UPDATE permet de modifier des données existantes",
                    "La commande UPDATE permet d'ajouter de nouvelles lignes",
                    "La commande UPDATE permet d'extraire des données d'une table",
                    "La commande UPDATE permet de supprimer des lignes d'une table"
                ]
                correct_answer = "La commande UPDATE permet de modifier des données existantes"
            elif "delete" in correct_answer.lower():
                sql_options = [
                    "La commande DELETE permet de supprimer des lignes d'une table",
                    "La commande DELETE permet de modifier des données existantes",
                    "La commande DELETE permet d'ajouter de nouvelles lignes",
                    "La commande DELETE permet d'extraire des données d'une table"
                ]
                correct_answer = "La commande DELETE permet de supprimer des lignes d'une table"
            elif "where" in correct_answer.lower():
                sql_options = [
                    "La clause WHERE filtre les résultats selon des conditions",
                    "La clause WHERE spécifie la table source des données",
                    "La clause WHERE regroupe les résultats selon des critères",
                    "La clause WHERE trie les résultats selon une ou plusieurs colonnes"
                ]
                correct_answer = "La clause WHERE filtre les résultats selon des conditions"
            elif "join" in correct_answer.lower():
                sql_options = [
                    "Les JOINs permettent de combiner des données de plusieurs tables",
                    "Les JOINs permettent de filtrer les résultats selon des conditions",
                    "Les JOINs permettent de trier les résultats selon une colonne",
                    "Les JOINs permettent de regrouper les résultats selon des critères"
                ]
                correct_answer = "Les JOINs permettent de combiner des données de plusieurs tables"
            else:
                # Options génériques pour SQL
                sql_options = [
                    "Les requêtes SQL permettent de manipuler les données dans une base de données",
                    "SQL est un langage de programmation orienté objet",
                    "SQL est utilisé principalement pour le développement d'interfaces utilisateur",
                    "SQL est un protocole de communication réseau"
                ]
                correct_answer = "Les requêtes SQL permettent de manipuler les données dans une base de données"

            # Mélanger les options
            np.random.shuffle(sql_options)
            # S'assurer que la réponse correcte est dans les options
            if correct_answer not in sql_options:
                sql_options[0] = correct_answer

            return sql_options, correct_answer

        # Options prédéfinies par domaine - courtes et bien formulées
        domain_options = {
            'html': [
                "Un langage de balisage structuré",
                "Un langage de programmation",
                "Un format de données XML",
                "Un protocole de communication",
                "Un système de gestion de contenu",
                "Un langage de description de page"
            ],
            'css': [
                "Un langage de style",
                "Un langage de programmation",
                "Un format de mise en page",
                "Un préprocesseur graphique",
                "Un système de grille responsive",
                "Un framework de design"
            ],
            'javascript': [
                "Un langage de programmation client",
                "Un langage de script interprété",
                "Un langage orienté objet",
                "Un langage de manipulation du DOM",
                "Un langage de traitement asynchrone",
                "Un langage multi-paradigme"
            ],
            'sql': [
                "Un langage de requête structuré",
                "Un système de gestion de base de données",
                "Un langage de définition de données",
                "Un langage de manipulation de données",
                "Un protocole de communication avec les bases de données",
                "Un standard pour l'interrogation de données",
                "Un langage déclaratif pour les bases de données",
                "Un outil d'analyse de données relationnelles"
            ],
            'programmation': [
                "Un processus de résolution de problèmes",
                "Une méthode de développement logiciel",
                "Un ensemble d'instructions pour ordinateur",
                "Une technique d'automatisation",
                "Un système de logique algorithmique"
            ],
            'general': [
                "Un concept fondamental",
                "Une technologie web moderne",
                "Une méthode standardisée",
                "Un outil de développement",
                "Une technique avancée"
            ]
        }

        # Options génériques pour tous les domaines
        generic_options = [
            "UN CONCEPT CLÉ DU DÉVELOPPEMENT WEB",
            "UNE TECHNIQUE FONDAMENTALE",
            "UN STANDARD INDUSTRIEL",
            "UNE MÉTHODE OPTIMISÉE"
        ]

        # Créer un ensemble d'options en utilisant uniquement des options prédéfinies
        options = []

        # Ajouter la réponse correcte si elle n'est pas vide
        if short_correct_answer:
            options.append(short_correct_answer)

        # Ajouter des options spécifiques au domaine
        if domain in domain_options:
            domain_specific_options = domain_options[domain]
            # Filtrer pour éviter les doublons avec la réponse correcte
            available_options = [opt for opt in domain_specific_options if opt != short_correct_answer and opt not in options]
            if available_options:
                options.extend(np.random.choice(available_options, min(3, len(available_options)), replace=False))

        # Compléter avec des options génériques si nécessaire
        if len(options) < 4:
            available_generic = [opt for opt in generic_options if opt not in options]
            if available_generic:
                options.extend(np.random.choice(available_generic, min(4-len(options), len(available_generic)), replace=False))

        # S'assurer qu'il y a exactement 4 options
        while len(options) > 4:
            # Ne pas supprimer la réponse correcte
            non_correct_options = [opt for opt in options if opt != short_correct_answer]
            if non_correct_options:
                options.remove(non_correct_options[0])
            else:
                options.pop()

        # Si nous n'avons toujours pas assez d'options, ajouter des options génériques
        while len(options) < 4:
            new_option = f"Option {len(options) + 1}"
            if new_option not in options:
                options.append(new_option)

        # Mélanger les options pour éviter que la réponse correcte soit toujours à la même position
        np.random.shuffle(options)

        return options, short_correct_answer

    def simplify_question(self, question, max_length=80):
        """Simplifier et raccourcir une question"""
        # Remplacer les formulations complexes
        simplified = question
        simplified = simplified.replace("Quelle est la définition de", "Que signifie")
        simplified = simplified.replace("Quelle est la différence entre", "Qu'est-ce qui distingue")
        simplified = simplified.replace("Quelle est l'application pratique de", "Comment utilise-t-on")
        simplified = simplified.replace("Quelle notion importante est présentée dans ce passage", "Quel concept est présenté ici")

        # Tronquer si nécessaire
        if len(simplified) > max_length:
            return simplified[:max_length-3] + "..."
        return simplified

    def generate_question(self, text_segment):
        if not text_segment or len(text_segment.strip()) < 10:
            return None

        # Extraire les phrases clés
        key_sentences = self.extract_key_sentences(text_segment)
        if not key_sentences:
            return None

        # Extraire les mots-clés
        keywords = self.extract_keywords(text_segment)
        if not keywords:
            return None

        # Détecter le domaine
        domain = self.detect_domain(text_segment)

        # Choisir une phrase comme réponse correcte
        correct_answer = key_sentences[0]

        # Sélectionner le type de question en fonction du domaine et des mots-clés
        if domain == 'javascript' and len(keywords) >= 1 and np.random.random() < 0.7:
            # Utiliser des templates spécifiques à JavaScript
            template = np.random.choice(self.js_templates)
            raw_question = template.format(keyword=keywords[0])
        elif domain == 'sql' and len(keywords) >= 1 and np.random.random() < 0.8:
            # Utiliser des templates spécifiques à SQL
            template = np.random.choice(self.sql_templates)
            # Filtrer les mots-clés pour trouver ceux liés à SQL
            sql_keywords = [k for k in keywords if k.lower() in ['select', 'insert', 'update', 'delete', 'from', 'where', 'join', 'table', 'database', 'requête', 'query']]
            # Utiliser un mot-clé SQL si disponible, sinon utiliser le premier mot-clé
            keyword = sql_keywords[0] if sql_keywords else keywords[0]
            raw_question = template.format(keyword=keyword)
        elif len(keywords) >= 2 and np.random.random() < 0.3:
            # Question de comparaison entre deux concepts
            template = np.random.choice(self.comparison_templates)
            raw_question = template.format(keyword1=keywords[0], keyword2=keywords[1])
        elif len(keywords) >= 1 and np.random.random() < 0.6:
            # Question de définition ou d'application
            if np.random.random() < 0.5:
                template = np.random.choice(self.definition_templates)
            else:
                template = np.random.choice(self.application_templates)
            raw_question = template.format(keyword=keywords[0])
        else:
            # Question générale sur le concept, mais éviter toujours la même question
            # Utiliser un template aléatoire avec une probabilité plus élevée pour les questions spécifiques
            if np.random.random() < 0.7 and len(keywords) >= 1:
                if domain == 'sql':
                    raw_question = f"Comment fonctionne {keywords[0]} dans une base de données ?"
                elif domain == 'javascript':
                    raw_question = f"Comment s'utilise {keywords[0]} en JavaScript ?"
                elif domain == 'html':
                    raw_question = f"À quoi sert la balise {keywords[0]} en HTML ?"
                elif domain == 'css':
                    raw_question = f"Comment appliquer {keywords[0]} en CSS ?"
                else:
                    raw_question = f"Expliquez le concept de {keywords[0]} présenté dans cette vidéo."
            else:
                raw_question = np.random.choice(self.concept_templates)

        # Simplifier et raccourcir la question
        question = self.simplify_question(raw_question)

        # Générer les options et obtenir la réponse correcte raccourcie
        options_result = self.generate_options(correct_answer, domain, keywords, sent_tokenize(text_segment))

        # Vérifier si le résultat est un tuple (cas spécial pour "Où écrire le code JavaScript")
        if isinstance(options_result, tuple) and len(options_result) == 2:
            options, short_correct_answer = options_result

            # Vérifier si nous sommes dans le cas spécial "Où écrire le code JavaScript"
            if hasattr(self, 'js_location_topic') and self.js_location_topic:
                # S'assurer que la réponse correcte est dans les options
                if short_correct_answer not in options:
                    # Remplacer une option aléatoire par la réponse correcte
                    options[np.random.randint(0, len(options))] = short_correct_answer
        else:
            # Cas standard où seules les options sont retournées
            options = options_result
            short_correct_answer = self.extract_short_answer(correct_answer)

        return {
            "question": question,
            "options": options,
            "correct_answer": short_correct_answer,  # Utiliser la version courte
            "domain": domain,
            "keywords": keywords[:3]  # Inclure les mots-clés pour référence
        }

    def generate_questions_from_transcript(self, transcript, num_questions=1, video_title=None, current_time=None):
        questions = []

        # Si nous avons un temps actuel, extraire seulement la partie récente de la transcription
        if current_time is not None and current_time > 300:  # Si nous sommes à plus de 5 minutes
            # Estimer la taille de la transcription pour 5 minutes (environ 150 mots par minute)
            recent_transcript = self.extract_recent_transcript(transcript, words_per_minute=150, minutes=5)
            segments = self.split_transcript(recent_transcript)
            print(f"Utilisation des 5 dernières minutes de transcription ({len(segments)} segments)", file=sys.stderr)
        else:
            segments = self.split_transcript(transcript)
            print(f"Utilisation de la transcription complète ({len(segments)} segments)", file=sys.stderr)

        # Si nous avons un titre de vidéo, essayer de générer une question spécifique au sujet
        if video_title:
            topic = self.extract_topic_from_title(video_title)
            if topic:
                # Stocker le sujet pour l'utiliser dans generate_options
                self.current_topic = topic

                # Utiliser le segment le plus récent et le plus long pour extraire les mots-clés
                if segments:
                    # Prendre le dernier segment (le plus récent) s'il y en a plusieurs
                    recent_segment = segments[-1] if len(segments) > 1 else segments[0]
                    keywords = self.extract_keywords(recent_segment)

                    # Générer une question spécifique au sujet
                    topic_question = self.generate_topic_specific_question(topic, keywords)

                    if topic_question:
                        # Vérifier si nous sommes dans un cas spécial pour JavaScript
                        if hasattr(self, 'js_location_topic') and self.js_location_topic:
                            # Créer une question spéciale pour "Où écrire le code JavaScript"
                            js_location_options = [
                                "Dans la section <head> du document HTML",
                                "Juste avant la fermeture de la balise </body>",
                                "Dans un fichier externe avec l'extension .js",
                                "Dans les attributs d'événements HTML"
                            ]
                            # Définir la réponse correcte
                            correct_answer = "Juste avant la fermeture de la balise </body>"
                            # Mélanger les options
                            np.random.shuffle(js_location_options)
                            # S'assurer que la réponse correcte est dans les options
                            if correct_answer not in js_location_options:
                                js_location_options[0] = correct_answer

                            # Créer la structure de question
                            question_data = {
                                "question": topic_question,
                                "options": js_location_options,
                                "correct_answer": correct_answer,
                                "domain": "javascript",
                                "keywords": ["javascript", "code", "placement"]
                            }
                            questions.append(question_data)
                            return questions  # Retourner immédiatement la question spécifique au sujet
                        elif hasattr(self, 'js_role_question') and self.js_role_question:
                            # Créer une question spéciale pour "Rôle du JavaScript"
                            js_role_options = [
                                "Ajouter de l'interactivité aux pages web",
                                "Créer des animations et effets visuels",
                                "Manipuler le contenu HTML dynamiquement",
                                "Communiquer avec des serveurs web"
                            ]
                            # Définir la réponse correcte
                            correct_answer = "Ajouter de l'interactivité aux pages web"
                            # Mélanger les options
                            np.random.shuffle(js_role_options)
                            # S'assurer que la réponse correcte est dans les options
                            if correct_answer not in js_role_options:
                                js_role_options[0] = correct_answer

                            # Créer la structure de question
                            question_data = {
                                "question": topic_question,
                                "options": js_role_options,
                                "correct_answer": correct_answer,
                                "domain": "javascript",
                                "keywords": ["javascript", "role", "web"]
                            }
                            questions.append(question_data)
                            return questions  # Retourner immédiatement la question spécifique au sujet
                        else:
                            # Générer une question complète avec le sujet spécifique
                            question_data = self.generate_question(recent_segment)
                            if question_data:
                                question_data["question"] = topic_question
                                questions.append(question_data)
                                return questions  # Retourner immédiatement la question spécifique au sujet

        # Si aucune question spécifique au sujet n'a été générée, utiliser l'approche standard
        # Mais en se concentrant sur les segments les plus récents
        if segments:
            # Commencer par le dernier segment (le plus récent)
            for segment in reversed(segments):
                question = self.generate_question(segment)
                if question:
                    questions.append(question)
                    if len(questions) >= num_questions:
                        break

        return questions

    def extract_recent_transcript(self, transcript, words_per_minute=150, minutes=5):
        """Extraire la partie récente de la transcription basée sur un nombre estimé de mots"""
        # Estimer le nombre de mots pour la durée spécifiée
        target_word_count = words_per_minute * minutes

        # Diviser la transcription en phrases
        sentences = sent_tokenize(transcript)

        # Compter à rebours depuis la fin pour obtenir environ X minutes de contenu
        word_count = 0
        recent_sentences = []

        for sentence in reversed(sentences):
            word_count += len(sentence.split())
            recent_sentences.insert(0, sentence)  # Ajouter au début pour maintenir l'ordre

            if word_count >= target_word_count:
                break

        return " ".join(recent_sentences)

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

    def extract_topic_from_title(self, title):
        """Extraire le sujet principal du titre de la vidéo"""
        # Détecter directement "Où écrire le code JavaScript" avec ou sans accents
        if title and ("javascript" in title.lower() and
                     ("ou ecrire" in title.lower() or "où écrire" in title.lower() or
                      "ou placer" in title.lower() or "où placer" in title.lower())):
            # Utiliser une version sans accents pour éviter les problèmes d'encodage
            self.js_location_topic = True
            return "Ou ecrire le code JavaScript"
        else:
            self.js_location_topic = False

        # Normaliser les caractères accentués pour éviter les problèmes d'encodage
        normalized_title = title
        if title:
            # Utiliser une table de correspondance pour les caractères accentués
            accents = {'\u00e9': 'e', '\u00e8': 'e', '\u00ea': 'e', '\u00eb': 'e',
                       '\u00e0': 'a', '\u00e2': 'a', '\u00e4': 'a',
                       '\u00ee': 'i', '\u00ef': 'i', '\u00ec': 'i', '\u00ed': 'i',
                       '\u00f4': 'o', '\u00f6': 'o', '\u00f2': 'o', '\u00f3': 'o',
                       '\u00fb': 'u', '\u00fc': 'u', '\u00f9': 'u', '\u00fa': 'u',
                       '\u00e7': 'c',
                       '\u00c9': 'E', '\u00c8': 'E', '\u00ca': 'E', '\u00cb': 'E',
                       '\u00c0': 'A', '\u00c2': 'A', '\u00c4': 'A',
                       '\u00ce': 'I', '\u00cf': 'I', '\u00cc': 'I', '\u00cd': 'I',
                       '\u00d4': 'O', '\u00d6': 'O', '\u00d2': 'O', '\u00d3': 'O',
                       '\u00db': 'U', '\u00dc': 'U', '\u00d9': 'U', '\u00da': 'U',
                       '\u00c7': 'C'}

            for accent, replacement in accents.items():
                normalized_title = normalized_title.replace(accent, replacement)

        # Rechercher des patterns courants dans les titres de cours
        course_patterns = [
            r'cours\s+(?:complet\s+)?sur\s+(\w+)',
            r'cours\s+(?:complet\s+)?(\w+)',
            r'apprendre\s+(\w+)',
            r'tutoriel\s+(\w+)',
            r'formation\s+(\w+)',
            r'\[(\d+)/\d+\]\s*-\s*(.+)',  # Format [N/M] - Sujet
            r'chapitre\s+(\d+)\s*[:-]\s*(.+)'
        ]

        # Extraire le sujet du titre
        topic = None
        for pattern in course_patterns:
            match = re.search(pattern, normalized_title, re.IGNORECASE)
            if match:
                # Si le pattern est [N/M] - Sujet, prendre le groupe 2
                if '/' in pattern:
                    topic = match.group(2).strip()
                else:
                    topic = match.group(1).strip()
                break

        # Si aucun pattern ne correspond, utiliser le titre complet
        if not topic and normalized_title:
            topic = normalized_title

        return topic

    def generate_topic_specific_question(self, topic, keywords=None):
        """Générer une question spécifique au sujet de la vidéo"""
        if not topic:
            return None

        # Stocker les mots-clés pour une utilisation ultérieure
        self.current_keywords = keywords

        # Vérifier si nous avons détecté le sujet "Où écrire le code JavaScript"
        if hasattr(self, 'js_location_topic') and self.js_location_topic:
            # Questions fixes pour "Où écrire le code JavaScript"
            return "Ou peut-on placer le code JavaScript dans une page web ?"

        # Convertir le sujet en minuscules pour les comparaisons
        topic_lower = topic.lower()

        # Extraire les termes techniques du sujet
        technical_terms = []
        if keywords and len(keywords) > 0:
            technical_terms = keywords
        else:
            # Extraire des mots-clés du titre si aucun n'est fourni
            words = re.findall(r'\b\w+\b', topic_lower)
            # Filtrer les mots courts et les mots communs
            common_words = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'pour', 'dans', 'sur', 'avec', 'par', 'ce', 'cette', 'ces']
            technical_terms = [w for w in words if len(w) > 3 and w not in common_words]

        # Si nous avons des termes techniques, générer une question spécifique
        if technical_terms and len(technical_terms) > 0:
            # Sélectionner un terme technique aléatoire
            term = technical_terms[0]

            # Modèles de questions variés basés sur le terme technique
            question_templates = [
                f"Quel est le rôle de {term} présenté dans cette vidéo ?",
                f"Comment fonctionne {term} dans ce contexte ?",
                f"À quoi sert {term} dans ce domaine ?",
                f"Comment utiliser {term} efficacement ?",
                f"Quelle est la fonction principale de {term} ?",
                f"Pourquoi {term} est-il important dans ce contexte ?",
                f"Comment {term} s'intègre-t-il dans l'ensemble ?",
                f"Quelles sont les caractéristiques principales de {term} ?"
            ]

            # Sélectionner un modèle de question aléatoire
            return np.random.choice(question_templates)

        # Questions spécifiques pour JavaScript
        if "javascript" in topic_lower:
            if "variable" in topic_lower:
                return "Comment déclare-t-on une variable en JavaScript ?"
            elif "fonction" in topic_lower:
                return "Comment définit-on une fonction en JavaScript ?"
            elif "objet" in topic_lower:
                return "Comment crée-t-on un objet en JavaScript ?"
            elif "dom" in topic_lower:
                return "Comment accéder aux éléments du DOM en JavaScript ?"
            elif "event" in topic_lower or "événement" in topic_lower:
                return "Comment gérer les événements en JavaScript ?"
            else:
                # Question générique sur JavaScript basée sur le sujet
                # Stocker un indicateur pour savoir que nous posons une question sur le rôle de JavaScript
                self.js_role_question = True
                return "Quel est le role du JavaScript dans le developpement web ?"

        # Générer une question basée sur le sujet de la vidéo
        topic_based_templates = [
            f"Quel est le concept principal de {topic} présenté dans cette vidéo ?",
            f"Comment fonctionne {topic} selon cette vidéo ?",
            f"Quelle est la caractéristique essentielle de {topic} ?",
            f"Quel aspect de {topic} est mis en avant dans cette vidéo ?"
        ]

        # Si le sujet est trop long, utiliser des questions plus génériques
        if len(topic) > 30:
            # Éviter les questions génériques qui commencent toujours par la même formulation
            general_questions = [
                "Quel est le concept principal abordé dans cette vidéo ?",
                "Quel est le sujet principal de cette vidéo ?",
                "Quelle est la notion fondamentale expliquée dans cette vidéo ?",
                "Quel est l'élément clé présenté dans cette vidéo ?",
                "Quelle technique importante est démontrée dans cette vidéo ?",
                "Quel principe essentiel est expliqué dans cette vidéo ?",
                "Quelle est l'idée centrale développée dans cette vidéo ?",
                "Quel est le point fondamental à retenir de cette vidéo ?"
            ]
            return np.random.choice(general_questions)
        else:
            return np.random.choice(topic_based_templates)

if __name__ == "__main__":
    # Lire la transcription depuis les arguments
    if len(sys.argv) > 1:
        transcript = sys.argv[1]

        # Récupérer le titre de la vidéo s'il est fourni
        video_title = sys.argv[2] if len(sys.argv) > 2 else ""

        # Créer une instance du générateur
        generator = QuestionGenerator()

        # Détecter le domaine à partir du titre si disponible
        domain_from_title = generator.detect_domain(video_title) if video_title else "general"
        print(f"Domaine détecté à partir du titre: {domain_from_title}", file=sys.stderr)

        # Extraire le sujet du titre
        topic = generator.extract_topic_from_title(video_title) if video_title else None
        if topic:
            print(f"Sujet extrait du titre: {topic}", file=sys.stderr)

        # Récupérer le temps actuel de la vidéo s'il est fourni
        current_time = float(sys.argv[3]) if len(sys.argv) > 3 else None
        if current_time is not None:
            print(f"Temps actuel de la vidéo: {current_time} secondes", file=sys.stderr)

        # Générer des questions en passant le titre de la vidéo et le temps actuel
        questions = generator.generate_questions_from_transcript(
            transcript,
            video_title=video_title,
            current_time=current_time
        )

        # Afficher la question générée
        if questions and len(questions) > 0:
            print(f"Question générée: {questions[0]['question']}", file=sys.stderr)

        # Si le domaine n'a pas été détecté dans la transcription mais est disponible dans le titre
        if questions and len(questions) > 0 and questions[0]["domain"] == "general" and domain_from_title != "general":
            questions[0]["domain"] = domain_from_title
            print(f"Domaine mis à jour avec celui du titre: {domain_from_title}", file=sys.stderr)

        # Convertir en JSON et imprimer
        print(json.dumps(questions))