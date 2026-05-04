import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import "./Subscription.css";

const plans = [
  {
    id: "basic",
    label: "Basic",
    price: "$9.99/mo",
    priceIdEnv: "VITE_STRIPE_PRICE_BASIC",
    description: "Perfect for occasional PDF/image conversions.",
  },
  {
    id: "pro",
    label: "Pro",
    price: "$19.99/mo",
    priceIdEnv: "VITE_STRIPE_PRICE_PRO",
    description:
      "Best for students who need unlimited access and premium features.",
  },
];

function Subscription() {
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const handleSubscribe = async (priceId) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/subscription/create-checkout`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId }),
        },
      );
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.error || "Unable to start checkout.");
      }
    } catch (err) {
      setMessage("Subscription service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-page">
      <header className="subscription-header">
        <h1>Pricing Plans</h1>
        <p>
          Choose a plan to unlock premium toolkit access and server-side
          conversions.
        </p>
      </header>

      <div className="plan-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-title">{plan.label}</div>
            <div className="plan-price">{plan.price}</div>
            <p>{plan.description}</p>
            <button
              type="button"
              onClick={() => {
                const priceId = import.meta.env[plan.priceIdEnv];
                if (!priceId) {
                  setMessage(`Missing ${plan.priceIdEnv} in frontend/.env`);
                  return;
                }
                handleSubscribe(priceId);
              }}
              disabled={!isLoaded || !user || loading}
            >
              {loading ? "Redirecting…" : "Subscribe"}
            </button>
          </div>
        ))}
      </div>

      {message && <div className="subscription-message">{message}</div>}
    </div>
  );
}

export default Subscription;
