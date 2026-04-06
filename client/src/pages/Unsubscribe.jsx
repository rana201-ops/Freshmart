import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("Processing...");
  const email = params.get("email");

  useEffect(() => {
    const unsubscribe = async () => {
      try {
        if (!email) {
          setMsg("Invalid unsubscribe link.");
          return;
        }

        await axios.get(
          `http://localhost:5000/api/subscribers/unsubscribe?email=${email}`
        );

        setMsg("You have been unsubscribed successfully ✅");
      } catch (err) {
        setMsg("Something went wrong.");
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>{msg}</h2>
    </div>
  );
};

export default Unsubscribe;
