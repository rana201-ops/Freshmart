import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import AuthProvider from "./context/AuthContext";
import { ShopProvider } from "./context/ShopContext";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import "bootstrap/dist/css/bootstrap.min.css";

// 👇 Yaha apni Stripe publishable key daalna
const stripePromise = loadStripe("pk_test_51T6Urq2NiWrORt0wYKzl94hsRkGtLuJaXYxnHNvU4jhwngGHIY6BHvztHHrp6SRD9lUj7mbjRqEnMsZNySyTM8Pm00nLeLueBI");

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <BrowserRouter>
    <AuthProvider>
      <ShopProvider>
        <Elements stripe={stripePromise}>
          <App />
        </Elements>
      </ShopProvider>
    </AuthProvider>
  </BrowserRouter>
);