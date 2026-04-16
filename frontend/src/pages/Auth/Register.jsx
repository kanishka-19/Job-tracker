import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

function Register() {
  const { login } = useAuth(); // reuse login flow to set token & user

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // basic client-side validation (quick)
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      // trim values before sending
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
      };

      const res = await registerUser(payload);
      setSuccess(res.data.message || "Registration successful. Please check your email to confirm your account.");
      setLoading(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Registration failed";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md min-h-[480px]"
      >
        <h2 className="text-2xl font-semibold mb-6">Create account</h2>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {success ? (
          <div className="text-green-700 text-center">{success}</div>
        ) : (
          <>
            <label className="block text-sm mb-1">Full name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />

            <label className="block text-sm mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />

            <label className="block text-sm mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full mb-6 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </>
        )}

        <p className="text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;