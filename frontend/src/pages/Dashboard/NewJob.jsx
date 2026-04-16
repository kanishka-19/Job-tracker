// src/pages/Dashboard/NewJob.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createJob } from "../../api/jobs";

export default function NewJob() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    company: "",
    position: "",
    status: "pending",
  });

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: (data) => {
      qc.invalidateQueries(["jobs"]);
      navigate(`/dashboard/job/${data._id}`); // redirect to the job details page
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create job";
      alert(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.position.trim()) {
      alert("Company and position are required");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Add New Job</h1>
        <button
          onClick={() => navigate("/dashboard/jobs")}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-md shadow space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            value={form.company}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, company: e.target.value }))
            }
            placeholder="Enter company name"
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <input
            type="text"
            value={form.position}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, position: e.target.value }))
            }
            placeholder="Enter position"
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full border rounded p-2"
          >
            <option value="pending">Pending</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
