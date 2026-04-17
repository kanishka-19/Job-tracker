import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getResumePresigned } from "../api/jobs";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default function ResumeViewer({ jobId, resumeKey = null }) {
  // Fetch presigned URL just like ResumeUploader
  const {
    data: presigned,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["resume", jobId],
    queryFn: getResumePresigned,
    enabled: !!resumeKey,
    staleTime: 1000 * 60,
  });

  const showPresigned = !!presigned?.url;

  const openResume = () => {
    if (showPresigned) {
      window.open(presigned.url, "_blank", "noopener,noreferrer");
    } else {
      // fallback to backend route
      const backendUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1/"}jobs/${encodeURIComponent(jobId)}/resume`;
      window.open(backendUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading)
    return <div className="text-sm text-gray-500">Loading resume…</div>;

  if (isError || (!showPresigned && !resumeKey)) {
    return <div className="text-sm text-gray-500">No resume uploaded</div>;
  }

  return (
    <button
      onClick={openResume}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
    >
      <DocumentTextIcon className="h-5 w-5" />
      View Resume
    </button>
  );
}
