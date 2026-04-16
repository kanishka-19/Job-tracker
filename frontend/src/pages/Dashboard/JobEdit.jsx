import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobById, updateJob, addInterview, deleteJob } from "../../api/jobs";
import ResumeUploader from "../../components/ResumeUploader";
import Notes from "../../components/Notes";

export default function JobEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ["job", id],
    queryFn: getJobById,
    enabled: !!id && id !== "new",
  });

  const [form, setForm] = useState({ company: "", position: "", status: "pending", location: "" });
  const [showAddInterview, setShowAddInterview] = useState(false);

  useEffect(() => {
    if (job) {
      setForm({
        company: job.company || "",
        position: job.position || "",
        status: job.status || "pending",
        location: job.location || "",
      });
    }
  }, [job]);

  const updateMut = useMutation({
    mutationFn: ({ jobId, payload }) => updateJob({ jobId, payload }),
    onSuccess: () => {
      qc.invalidateQueries(["job", id]);
      qc.invalidateQueries(["jobs"]);
      navigate(`/dashboard/job/${id}`);
    },
    onError: (err) => {
      console.error("update job error", err);
      alert(err?.response?.data?.message || "Failed to update job");
    },
  });

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

  if (isLoading) return <div className="p-4">Loading…</div>;
  if (isError) return <div className="p-4 text-red-600">Error: {error?.message || "Failed to load job"}</div>;

  const handleSave = () => {
    const payload = {
      company: form.company.trim(),
      position: form.position.trim(),
      status: form.status,
      location: form.location?.trim(),
    };
    updateMut.mutate({ jobId: id, payload });
  };

  const handleDelete = () => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    deleteMut.mutate({ jobId: id });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit job</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 border rounded">Cancel</button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded">
            {updateMut.isLoading ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setShowAddInterview(true)} className="px-3 py-1.5 bg-green-600 text-white rounded">Add interview</button>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-red-500 text-red-600 rounded">Delete</button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} className="p-2 border rounded" placeholder="Company" />
          <input value={form.position} onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))} className="p-2 border rounded" placeholder="Position" />
          <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="p-2 border rounded">
            <option value="applied">Applied</option>
            <option value="pending">Pending</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
          <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="p-2 border rounded md:col-span-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Notes</h3>
          <Notes jobId={id} initialNotes={job.notes || []} />
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Resume</h3>
          <ResumeUploader jobId={id} resumeKey={job.resumeKey || null} />
        </div>
      </div>

      {/* Add Interview Modal */}
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

// AddInterviewModal (same small modal used on edit)
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
