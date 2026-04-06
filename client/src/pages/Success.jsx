import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";

const Success = () => {
  const [params] = useSearchParams();
  const email = params.get("email");

  useEffect(() => {
    if (email) {
      api.post("/api/subscribers/subscribe", { email });
    }
  }, [email]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Payment Successful 🎉</h2>
      <p>You are now subscribed!</p>
    </div>
  );
};

export default Success;