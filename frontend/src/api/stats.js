// src/api/stats.js
import api from "./axios"; // adjust path if your axios file is at src/api/axios.js

export async function getStats() {
  try {
    // IMPORTANT: endpoint must match your backend route exactly
    // If your backend mounts stats under /jobs, call "/jobs/stats"
    // If it is /stats directly, call "/stats"
    // From your Postman screenshot earlier you used: http://localhost:8080/api/v1/stats
    // So use "/stats" unless your server expects "/jobs/stats".
    const res = await api.get("/stats");
    return res.data;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Failed to fetch stats";
    throw new Error(msg);
  }
}
