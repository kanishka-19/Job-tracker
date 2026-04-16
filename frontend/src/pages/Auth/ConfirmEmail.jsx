import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { confirmEmail } from "../../api/auth"; // You need to implement this API call

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const id = searchParams.get("id");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !id) {
      setError("Invalid confirmation link.");
      return;
    }
    confirmEmail({ token, id })
      .then(res => {
        setMessage(res.data.message || "Email confirmed!");
        setTimeout(() => navigate("/login"), 2000);
      })
      .catch(err => setError(err?.response?.data?.message || "Confirmation failed."));
  }, [token, id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">Email Confirmation</h2>
        {error ? <div className="text-red-600">{error}</div> : <div className="text-green-700">{message}</div>}
      </div>
    </div>
  );
}