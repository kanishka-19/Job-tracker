// src/components/Notes.jsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotes, addNote, deleteNote } from "../api/jobs";

export default function Notes({ jobId, initialNotes = [] }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  // fetch notes (use initial data coming from job list if present)
  const { data: notes = [], isLoading, isError } = useQuery({
    queryKey: ["notes", jobId],
    queryFn: getNotes,
    initialData: initialNotes,
    // short ttl
    staleTime: 1000 * 30,
  });

  // add note mutation
  const addMutation = useMutation({
    mutationFn: ({ jobId, text }) => addNote({ jobId, text }),
    onSuccess: (newNotes) => {
      // newNotes is the array returned by backend
      qc.setQueryData(["notes", jobId], newNotes);
      // also refresh jobs list so job.notes shows up
      qc.invalidateQueries(["jobs"]);
      setText("");
    },
  });

  // delete note mutation
  const delMutation = useMutation({
    mutationFn: ({ jobId, noteId }) => deleteNote({ jobId, noteId }),
    onSuccess: (newNotes) => {
      qc.setQueryData(["notes", jobId], newNotes);
      qc.invalidateQueries(["jobs"]);
    },
  });

  const handleAdd = (e) => {
    // if inside a <form>, prevent default
    if (e && e.preventDefault) e.preventDefault();
    const t = text.trim();
    if (!t) return;
    addMutation.mutate({ jobId, text: t });
  };

  const handleDelete = (noteId) => {
    if (!noteId) return;
    delMutation.mutate({ jobId, noteId });
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 p-2 border rounded text-sm"
        />
        <button
          type="submit"
          className="px-3 py-1 border rounded text-sm"
          disabled={addMutation.isLoading}
        >
          {addMutation.isLoading ? "Adding…" : "Add"}
        </button>
      </form>

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading notes…</div>
        ) : isError ? (
          <div className="text-sm text-red-600">Failed to load notes</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-gray-500">No notes yet</div>
        ) : (
          notes.map((n) => (
            <div key={n._id} className="flex items-start justify-between bg-white rounded p-2 border">
              <div className="text-sm">
                <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                <div className="mt-1">{n.body}</div>
              </div>
              <div>
                <button
                  onClick={() => handleDelete(n._id)}
                  className="text-sm text-red-600 hover:underline ml-3"
                  disabled={delMutation.isLoading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
