import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginUser, forgotPassword } from "../../api/auth";

function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // forgot password state
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(form); // API call
      login(res.data); // save token + user (AuthContext)
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handlers
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");
    if (!forgotEmail) {
      setForgotError("Please enter your email");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await forgotPassword({ email: forgotEmail });
      setForgotMessage(res.data?.message || "If an account exists, a reset link was sent");
    } catch (err) {
      setForgotError(err.response?.data?.message || "Unable to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
  <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md min-h-[480px]">
        {!isForgot ? (
          <>
            <h2 className="text-2xl font-semibold mb-6">Login</h2>

            {error && <div className="text-red-600 text-center mb-3">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className="block text-sm mb-1 sr-only">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />

              <label className="block text-sm mb-1 sr-only">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full mb-6 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsForgot(true);
                  setForgotMessage("");
                  setForgotError("");
                  setForgotEmail(form.email || "");
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Register
                </Link>
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-6">Reset password</h2>

            {forgotMessage ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded mb-3">
                <p className="text-green-800 text-sm">{forgotMessage}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Check your email for the reset link. The link expires in 1 hour.
                </p>
              </div>
            ) : null}

            {forgotError && <p className="text-red-600 mb-2">{forgotError}</p>}

            <form onSubmit={handleForgotSubmit}>
              <input
                type="email"
                name="forgotEmail"
                placeholder="Enter your account email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-60"
                >
                  {forgotLoading ? "Sending..." : "Send reset link"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(false);
                    setForgotMessage("");
                    setForgotError("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded hover:bg-gray-300"
                >
                  Back to login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
