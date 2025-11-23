import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./StripeCheckoutModal.css";


const stripePromise = loadStripe("pk_test_51SQaztKfHZV6S7JiLJNIWUaD7jTP65Ifanc034Aheyvb8gbRJUCeG5mdMbwoDi18T9HuA7W9HV90qzhuMbIOdy1R00e9WNUiBa");

function CheckoutForm({ clientSecret, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required",
    });

    if (error) {
      setError(error.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="stripe-modal">
      <div className="stripe-modal-content">
        <h3>Pagar con tarjeta</h3>
        <form onSubmit={handleSubmit}>
          <PaymentElement />
          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary" disabled={!stripe || loading}>
              {loading ? "Procesando..." : "Pagar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StripeCheckoutModal({ amount, onSuccess, onClose }) {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    
    fetch("http://localhost:5000/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "pen" }), 
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [amount]);

  if (!clientSecret) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} onClose={onClose} onSuccess={onSuccess} />
    </Elements>
  );
}
