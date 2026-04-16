// src/pages/Auth/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const id = searchParams.get("id");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // quick feedback if link missing parts
    if (!token || !id) {
      setError("Invalid reset link. Make sure you used the link from the email.");
    }
  }, [token, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!token || !id) return setError("Missing token or id in URL.");

    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const payload = { token, id, newPassword: password };
      const res = await resetPassword(payload); // expects { accessToken? }
      setInfo(res?.data?.message || "Password changed successfully.");

      // If backend returned accessToken, auto-login
      if (res?.data?.accessToken) {
        // login expects an object like what your Login used earlier: login(res.data)
        // adapt if your AuthContext expects a different shape
        try {
          login(res.data); // stores token + user in context
          navigate("/"); // go to dashboard/home
          return;
        } catch (e) {
          // fallback: redirect to login
        }
      }

      // otherwise redirect to login after a short pause
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Reset failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Set a new password</h2>

        {error && <div className="mb-3 text-red-600">{error}</div>}
        {info && <div className="mb-3 text-green-700">{info}</div>}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
            placeholder="At least 6 characters"
            required
            minLength={6}
          />

          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
            placeholder="Re-enter new password"
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save new password"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-500">
          <p>If you didn't request this, ignore this email or contact support.</p>
        </div>
      </div>
    </div>
  );
}
