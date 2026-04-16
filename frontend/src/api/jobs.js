// src/api/jobs.js
import api from "./axios";

// LIST jobs (with filters)
// queryKey is ['jobs', params]
export const createJob = async (payload) => {
  const res = await api.post("jobs", payload);
  return res.data;
};

export const getJobs = async ({ queryKey }) => {
  const [, params] = queryKey;
  const qs = new URLSearchParams(params || {}).toString();
  const url = `jobs${qs ? `?${qs}` : ""}`;   // relative to baseURL
  const res = await api.get(url);
  return res.data;
};

// GET job by id
export const getJobById = async ({ queryKey }) => {
  const [, jobId] = queryKey;
  const res = await api.get(`jobs/${jobId}`);
  return res.data;
};

// GET notes for a job
export const getNotes = async ({ queryKey }) => {
  // queryKey = ['notes', jobId]
  const [, jobId] = queryKey;
  const res = await api.get(`jobs/${jobId}/notes`);
  // backend responds { notes: [...] }
  return res.data.notes;
};

// Notes
// NOTE: backend expects { body } in req.body
export const addNote = async ({ jobId, text }) => {
  const res = await api.post(`jobs/${jobId}/notes`, { body: text });
  // backend returns { notes }
  return res.data.notes;
};

export const deleteNote = async ({ jobId, noteId }) => {
  const res = await api.delete(`jobs/${jobId}/notes/${noteId}`);
  return res.data.notes; // backend returns { notes }
};

// Resume
export const uploadResume = async ({ jobId, file }) => {
  const form = new FormData();
  form.append("resume", file); // <-- send as "resume"
  const res = await api.post(`jobs/${jobId}/resume`, form);
  return res.data;
};

export const deleteResume = async ({ jobId }) => {
  const res = await api.delete(`jobs/${jobId}/resume`);
  return res.data;
};

export const getResumePresigned = async ({ queryKey }) => {
  // queryKey = ['resume', jobId]
  const [, jobId] = queryKey;
  const res = await api.get(`jobs/${jobId}/resume`);
  return res.data; // { url }
};

// src/api/jobs.js (add near other exports)
export const updateJob = async ({ jobId, payload }) => {
  const res = await api.patch(`jobs/${jobId}`, payload);
  return res.data;
};

export const deleteJob = async ({ jobId }) => {
  const res = await api.delete(`jobs/${jobId}`);
  return res.data;
};

export const changeJobStatus = async ({ jobId, status }) => {
  const res = await api.patch(`jobs/${jobId}`, { status });
  return res.data;
};


export const getInterviews = async ({ queryKey }) => {
  // queryKey = ['interviews', jobId]
  const [, jobId] = queryKey;
  const res = await api.get(`jobs/${jobId}/interviews`);
  return res.data.interviews; // returns array
};

export const addInterview = async ({ jobId, interview }) => {
  // interview: { date, type, notes }
  const res = await api.post(`jobs/${jobId}/interviews`, interview);
  return res.data; // { message, interviews }
};