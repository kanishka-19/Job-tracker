import api from "./axios";

// Get current user profile
export const getUserProfile = async () => {
  const res = await api.get("user");
  return res.data;
};

// Update user profile
export const updateUserProfile = async (payload) => {
  const res = await api.patch("user", payload);
  return res.data;
};

// Upload avatar
export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append("avatar", file);
  const res = await api.post("user/avatar", form);
  return res.data;
};

// Delete avatar
export const deleteAvatar = async () => {
  const res = await api.delete("user/avatar");
  return res.data;
};

// Upload resume
export const uploadResume = async (file) => {
  const form = new FormData();
  form.append("resume", file);
  const res = await api.post("user/resume", form);
  return res.data;
};

// Delete resume
export const deleteResume = async () => {
  const res = await api.delete("user/resume");
  return res.data;
};