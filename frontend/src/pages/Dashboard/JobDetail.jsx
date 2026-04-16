// src/pages/Dashboard/JobDetail.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobById, getInterviews, addInterview, deleteJob } from "../../api/jobs";
import ResumeViewer from "../../components/ResumeViewer"; // reuse same component as edit (viewOnly mode)
import Notes from "../../components/Notes";

export default function JobDetail() {
  // --- Hooks & top-level state (must come before any conditional returns) ---
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showAddInterview, setShowAddInterview] = useState(false);

  const validId = !!id && id !== "new";

  // --- Queries ---
  const {
    data: job,
    isLoading: jobLoading,
    isError: jobError,
    error: jobErr,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: getJobById,
    enabled: validId,
  });

  const {
    data: interviews = [],
    isLoading: interviewsLoading,
  } = useQuery({
    queryKey: ["interviews", id],
    queryFn: getInterviews,
    enabled: validId,
  });

  // --- Mutations (declare before any returns) ---
  const deleteMut = useMutation({
    mutationFn: ({ jobId }) => deleteJob({ jobId }),
    onSuccess: () => {
      qc.invalidateQueries(["jobs"]);
      navigate("/dashboard");
    },
    onError: (err) => {
      console.error("delete job error", err);
      alert("Failed to delete job");
    },
  });

  const addInterviewMut = useMutation({
    mutationFn: ({ jobId, interview }) => addInterview({ jobId, interview }),
    onSuccess: () => {
      qc.invalidateQueries(["interviews", id]);
      qc.invalidateQueries(["job", id]);
      setShowAddInterview(false);
    },
    onError: (err) => {
      console.error("add interview error", err);
      alert(err?.response?.data?.message || "Failed to add interview");
    },
  });

  // --- Derived values (hooks that rely on query data) ---
  const lastNotes = useMemo(() => (job?.notes || []).slice(-2).reverse(), [job?.notes]);

  // --- Effects ---
  useEffect(() => {
    if (!validId) return;
    const openFlag = searchParams.get("openAddInterview");
    if (openFlag && job) {
      setShowAddInterview(true);
      const params = new URLSearchParams(window.location.search);
      params.delete("openAddInterview");
      // replace URL to remove flag without reloading
      window.history.replaceState({}, "", `${window.location.pathname}`);
    }
  }, [searchParams, job, validId]);

  // --- Handlers ---
  const handleDelete = () => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    deleteMut.mutate({ jobId: id });
  };

  // --- Conditional rendering AFTER hooks are declared ---
  if (!validId) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">New Job</h2>
        <p className="text-sm text-gray-600 mt-2">You're creating a new job. Use the Add Job flow to create it.</p>
      </div>
    );
  }

  if (jobLoading) return <div className="p-6">Loading job…</div>;
  if (jobError) return <div className="p-6 text-red-600">Error: {jobErr?.message || "Failed to load job"}</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  // Prepare interview lists
  const now = new Date();
  const upcoming = interviews.filter(i => new Date(i.date) > now);
  const past = interviews.filter(i => new Date(i.date) <= now);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {job.company} <span className="text-gray-600 font-normal">— {job.position}</span>
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            <strong>Status:</strong> {job.status} • Applied:{" "}
            {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dashboard/job/${id}/edit`)}
            className="px-3 py-1.5 border rounded text-sm"
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 border border-red-500 text-red-600 rounded text-sm"
          >
            Delete
          </button>

          <button onClick={() => navigate(-1)} className="px-3 py-1.5 border rounded text-sm">
            Back
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Interviews */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Upcoming interviews</h3>

          {interviewsLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : upcoming.length ? (
            upcoming.map(iv => (
              <div key={iv._id || iv.date} className="border-t py-2 first:border-t-0">
                <div className="text-sm font-medium">{new Date(iv.date).toLocaleString()}</div>
                <div className="text-sm text-gray-600">{iv.type}{iv.notes ? ` — ${iv.notes}` : ""}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No upcoming interviews</p>
          )}

          <h4 className="text-sm font-semibold mt-4 mb-2">Past interviews</h4>
          {past.length ? (
            past.map(iv => (
              <div key={iv._id || iv.date} className="border-t py-2 first:border-t-0">
                <div className="text-sm font-medium">{new Date(iv.date).toLocaleDateString()}</div>
                <div className="text-sm text-gray-600">{iv.type}{iv.notes ? ` — ${iv.notes}` : ""}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No past interviews</p>
          )}
        </div>

        {/* Right - Notes + Resume */}
        <div className="space-y-4">
          {/* Notes */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Notes</h3>
            {lastNotes.length === 0 ? (
              <div className="text-sm text-gray-500">No notes yet</div>
            ) : (
              lastNotes.map((n) => (
                <div key={n._id} className="mb-2 p-2 border rounded bg-gray-50">
                  <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm">{n.body}</div>
                </div>
              ))
            )}
          </div>

          {/* Resume (reuse ResumeUploader in view-only mode) */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Resume</h3>
            <div className="p-3 border rounded bg-gray-50">
              <ResumeViewer jobId={id} resumeKey={job.resumeKey || null} viewOnly />
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <div><strong>Created:</strong> {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}</div>
            <div><strong>Updated:</strong> {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : "—"}</div>
          </div>
        </div>
      </div>

      {/* Add Interview modal (kept for compatibility with query param flow) */}
      {showAddInterview && (
        <AddInterviewModal
          onClose={() => setShowAddInterview(false)}
          onSubmit={(payload) => addInterviewMut.mutate({ jobId: id, interview: payload })}
          loading={addInterviewMut.isLoading}
        />
      )}
    </div>
  );
}

/* AddInterviewModal component (small local modal) */
function AddInterviewModal({ onClose, onSubmit, loading }) {
  const [date, setDate] = useState("");
  const [type, setType] = useState("virtual");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!date) {
      alert("Please select date & time");
      return;
    }
    const iso = new Date(date).toISOString();
    onSubmit({ date: iso, type, notes });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg p-5 w-full max-w-md shadow">
        <h3 className="text-lg font-semibold mb-3">Add Interview</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Date & time</label>
            <input type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e)=>setType(e.target.value)} className="w-full border rounded p-2">
              <option value="virtual">Virtual</option>
              <option value="phone">Phone</option>
              <option value="onsite">Onsite</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full border rounded p-2" rows="3" />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">
            {loading ? "Adding…" : "Add Interview"}
          </button>
        </div>
      </div>
    </div>
  );
}
