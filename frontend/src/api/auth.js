import api from "./axios";

export const loginUser = (credentials) => api.post("/auth/login", credentials);
export const registerUser = (data) => api.post("/auth/register", data);
// FORGOT PASSWORD — triggers email with reset link
export const forgotPassword = (data) => api.post("/auth/forgot", data);

// RESET PASSWORD — called from reset-password page with token + id + newPassword
export const resetPassword = (data) => api.post("/auth/reset", data);

// CHANGE PASSWORD — called from logged-in user settings (requires auth header)
export const changePassword = (data) => api.post("/auth/change-password", data);

export const confirmEmail = ({ id, token }) =>
  api.post("/auth/confirm-email", { id, token });