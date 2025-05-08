import sys
print('Python version:', sys.version)

try:
    import flask
    print('Flask est installé:', flask.__version__)
except ImportError:
    print('Flask n\'est pas installé')

try:
    import flask_cors
    print('Flask-CORS est installé')
except ImportError:
    print('Flask-CORS n\'est pas installé')

try:
    import tensorflow
    print('TensorFlow est installé:', tensorflow.__version__)
except ImportError:
    print('TensorFlow n\'est pas installé')

try:
    import nltk
    print('NLTK est installé:', nltk.__version__)
except ImportError:
    print('NLTK n\'est pas installé')

try:
    import numpy
    print('NumPy est installé:', numpy.__version__)
except ImportError:
    print('NumPy n\'est pas installé')

try:
    import requests
    print('Requests est installé:', requests.__version__)
except ImportError:
    print('Requests n\'est pas installé')
