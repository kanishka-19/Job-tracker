// src/components/ResumeUploader.jsx
import React, { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getResumePresigned, uploadResume, deleteResume } from "../api/jobs";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  TrashIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

export default function ResumeUploader({ jobId, resumeKey = null }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [status, setStatus] = useState({ msg: null, type: null }); // type: 'success' | 'error' | 'info'

  // Fetch presigned URL only when there is a resumeKey
  const {
    data: presigned,
    isLoading: presignedLoading,
    isError: presignedError,
  } = useQuery({
    queryKey: ["resume", jobId],
    queryFn: getResumePresigned,
    enabled: !!resumeKey,
    staleTime: 1000 * 60,
  });

  // Upload mutation
  const uploadMut = useMutation({
    mutationFn: ({ jobId, file }) => uploadResume({ jobId, file }),
    onSuccess: (res) => {
      setStatus({ msg: "Resume uploaded", type: "success" });
      qc.invalidateQueries(["resume", jobId]);
      qc.invalidateQueries(["jobs"]);
    },
    onError: (err) => {
      console.warn("upload error", err);
      const msg = err?.response?.data?.message || "Upload failed";
      setStatus({ msg, type: "error" });
    },
  });

  // Delete mutation
  const deleteMut = useMutation({
    mutationFn: ({ jobId }) => deleteResume({ jobId }),
    onSuccess: () => {
      setStatus({ msg: "Resume deleted", type: "success" });
      qc.removeQueries(["resume", jobId]);
      qc.invalidateQueries(["jobs"]);
    },
    onError: (err) => {
      console.warn("delete error", err);
      const msg = err?.response?.data?.message || "Delete failed";
      setStatus({ msg, type: "error" });
    },
  });

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setStatus({ msg: "Uploading…", type: "info" });
    uploadMut.mutate({ jobId, file: f });
    e.target.value = "";
  };

  const handleDelete = () => {
    if (!confirm("Delete resume?")) return;
    setStatus({ msg: "Deleting…", type: "info" });
    deleteMut.mutate({ jobId });
  };

  // UI helpers
  const statusColor =
    status.type === "success"
      ? "text-green-600"
      : status.type === "error"
      ? "text-red-600"
      : "text-gray-600";
  const showPresigned = !!presigned?.url;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume
          </label>

          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              onChange={handleFileChange}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileRef.current && fileRef.current.click()}
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:shadow focus:outline-none"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              <span>Choose</span>
            </button>

            <div className="flex-1 text-sm text-gray-500">
              {showPresigned ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Uploaded</span>
                </span>
              ) : (
                <span>No resume uploaded</span>
              )}
            </div>

            {/* Delete button (only enabled when a resume exists) */}
            <button
              onClick={handleDelete}
              disabled={!showPresigned || deleteMut.isLoading}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border ${
                showPresigned
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-300 cursor-not-allowed"
              }`}
            >
              <TrashIcon className="h-4 w-4" />
              <span>{deleteMut.isLoading ? "Deleting…" : "Delete"}</span>
            </button>
          </div>

          {/* Feedback / status */}
          <div className="mt-3">
            {status.msg && <div className={`text-sm ${statusColor}`}>{status.msg}</div>}

            {/* If presigned fetch is loading */}
            {presignedLoading && (
              <div className="text-sm text-gray-500 mt-1">Loading resume preview…</div>
            )}

            {/* If presigned fetch errored but the user just deleted resume we prefer the deletion success message */}
            {presignedError && !status.msg && (
              <div className="text-sm text-red-600 mt-1">Unable to load resume</div>
            )}
          </div>
        </div>
      </div>

      {/* Links row (View resume) */}
      <div className="mt-3">
        {showPresigned ? (
          <a
            href={presigned.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100"
          >
            <DocumentTextIcon className="h-5 w-5" />
            View Resume
          </a>
        ) : null}
      </div>
    </div>
  );
}
