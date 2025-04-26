import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import Cookies from 'js-cookie';
import './PaymentForm.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ courseId, amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isAlreadyPurchased, setIsAlreadyPurchased] = useState(false);

  // Vérifier si le cours est déjà acheté au chargement du composant
  useEffect(() => {
    const checkIfAlreadyPurchased = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) return;

        // Récupérer les informations de l'utilisateur
        const response = await axios.get('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.data && response.data.enrolledCourses) {
          // Vérifier si le cours est déjà acheté
          const enrolledCourses = response.data.enrolledCourses;
          console.log("Vérification si le cours est déjà acheté:", courseId);
          console.log("Cours achetés:", enrolledCourses);

          // Convertir l'ID du cours en chaîne
          const courseIdStr = courseId.toString();

          // Vérifier si le cours est dans la liste des cours achetés
          const isEnrolled = enrolledCourses.some(course => {
            if (course.courseId && typeof course.courseId === 'object' && course.courseId._id) {
              return course.courseId._id.toString() === courseIdStr;
            } else if (course.courseId) {
              return course.courseId.toString() === courseIdStr;
            }
            return false;
          });

          if (isEnrolled) {
            console.log("Le cours est déjà acheté!");
            setIsAlreadyPurchased(true);
            setError('Vous avez déjà acheté ce cours. Vous pouvez y accéder depuis votre profil.');
            // Rediriger vers la page du cours après un court délai
            setTimeout(() => {
              onSuccess(); // Utiliser onSuccess pour rediriger vers le cours
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification si le cours est déjà acheté:", error);
      }
    };

    checkIfAlreadyPurchased();
  }, [courseId, onSuccess]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      try {
        // Create payment intent
        const { data: { clientSecret } } = await axios.post('http://localhost:5000/api/payments/create-payment-intent', {
          courseId
        }, config);

        // Confirm the payment
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        });

        if (stripeError) {
          setError(stripeError.message);
          setProcessing(false);
          return;
        }

        // Confirm payment on our backend
        await axios.post('http://localhost:5000/api/payments/confirm-payment', {
          paymentIntentId: paymentIntent.id
        }, config);

        onSuccess();
      } catch (apiError) {
        // Vérifier si l'erreur est due à un cours déjà acheté
        if (apiError.response?.status === 400 && apiError.response?.data?.error === 'Vous avez déjà acheté ce cours') {
          setError('Vous avez déjà acheté ce cours. Vous pouvez y accéder depuis votre profil.');
          // Rediriger vers la page du cours après un court délai
          setTimeout(() => {
            onSuccess(); // Utiliser onSuccess pour rediriger vers le cours
          }, 2000);
        } else {
          throw apiError; // Relancer l'erreur pour qu'elle soit traitée par le bloc catch externe
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Le paiement a échoué');
    } finally {
      setProcessing(false);
    }
  };

  // Si le cours est déjà acheté, afficher uniquement un message
  if (isAlreadyPurchased) {
    return (
      <div className="payment-form">
        <div
          className="payment-error already-purchased-message"
          data-already-purchased="true"
        >
          <h3>Cours déjà acheté</h3>
          <p>Vous avez déjà acheté ce cours. Vous allez être redirigé vers la page du cours...</p>
        </div>
      </div>
    );
  }

  // Sinon, afficher le formulaire de paiement normal
  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <h3>Total: ${amount}</h3>
      </div>

      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div
          className="payment-error"
          data-already-purchased={error.includes('Vous avez déjà acheté ce cours')}
        >
          {error}
        </div>
      )}

      <div className="payment-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="cancel-button"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="pay-button"
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
};

const PaymentFormWrapper = (props) => (
  <Elements stripe={stripePromise}>
    <PaymentForm {...props} />
  </Elements>
);

export default PaymentFormWrapper;