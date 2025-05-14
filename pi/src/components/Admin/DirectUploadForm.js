import { useRef, useEffect } from 'react';
import Cookies from 'js-cookie';

/**
 * Composant pour uploader directement des fichiers sans passer par AJAX/Axios
 * Utilise un formulaire HTML natif et une iframe cach�e pour �viter les probl�mes CORS
 */
const DirectUploadForm = ({ courseId, title, description, file, onSuccess, onError, onComplete }) => {
  const formRef = useRef(null);
  const iframeRef = useRef(null);
  const uniqueId = `upload-frame-${Date.now()}`;

  // �couter les messages de l'iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // V�rifier que le message vient de notre domaine
      if (event.origin !== 'https://ikramsegni.fr') return;

      try {
        const data = JSON.parse(event.data);
        if (data.success) {
          if (onSuccess) onSuccess(data);
        } else {
          if (onError) onError(new Error(data.message || 'Upload failed'));
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        if (onError) onError(error);
      } finally {
        if (onComplete) onComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError, onComplete]);

  // Soumettre le formulaire
  const submitForm = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  // Ajouter le fichier au formulaire
  useEffect(() => {
    if (file && formRef.current) {
      // Cr�er un nouvel �l�ment input file
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.name = 'video';
      fileInput.style.display = 'none';

      // Cr�er un nouveau FileList contenant notre fichier
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // Ajouter l'input au conteneur
      const container = formRef.current.querySelector('#file-container');
      if (container) {
        // Vider le conteneur d'abord
        container.innerHTML = '';
        container.appendChild(fileInput);

        console.log('Fichier ajout� au formulaire:', file.name);
      }
    }
  }, [file]);

  // D�clencher la soumission du formulaire apr�s le rendu
  useEffect(() => {
    if (file && title && description && courseId && formRef.current) {
      // Attendre un peu pour s'assurer que le fichier est bien ajout� au formulaire
      const timer = setTimeout(() => {
        console.log('Soumission du formulaire...');
        submitForm();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [file, title, description, courseId]);

  return (
    <div style={{ display: 'none' }}>
      <iframe
        name={uniqueId}
        id={uniqueId}
        ref={iframeRef}
        title="Upload Frame"
        style={{ display: 'none' }}
      ></iframe>

      <form
        ref={formRef}
        action="https://ikramsegni.fr/api/videos"
        method="POST"
        encType="multipart/form-data"
        target={uniqueId}
      >
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="authorization" value={`Bearer ${Cookies.get('token')}`} />

        {/* Nous devons cr�er un �l�ment de fichier qui contient le fichier s�lectionn� */}
        <div id="file-container"></div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default DirectUploadForm;
