// src/pages/Dashboard/Jobs.jsx
import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getJobs, updateJob, deleteJob, changeJobStatus, addInterview } from "../../api/jobs";
import Notes from "../../components/Notes";
import ResumeUploader from "../../components/ResumeUploader";

/* Small UI helpers */
function StatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    shortlisted: "bg-green-100 text-green-800",
    interview: "bg-indigo-100 text-indigo-800",
    rejected: "bg-red-100 text-red-800",
  };
  const cls = map[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status ? status[0].toUpperCase() + status.slice(1) : "Unknown"}
    </span>
  );
}

/* PortalMenu - renders the floating menu into document.body */
function PortalMenu({ anchorRect, width = 200, flipUp = false, children, onClose }) {
  if (!anchorRect) return null;

  // compute position in viewport coordinates
  // right-align the menu to the anchor's right edge (unless that would overflow)
  const padding = 8;
  const leftPref = anchorRect.right - width;
  const left = Math.max(padding, leftPref);
  const top = flipUp ? anchorRect.top - padding : anchorRect.bottom + padding;

  const style = {
    position: "absolute",
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    zIndex: 9999,
  };

  return createPortal(
    <div style={style} onMouseLeave={onClose} className="pointer-events-auto">
      <div className="bg-white border rounded-md shadow-md">{children}</div>
    </div>,
    document.body
  );
}

/* Interactive 3-dot menu implemented with a portal to avoid clipping by overflow containers */
function ActionsMenu({ job, onView, onEdit, onChangeStatus, onDelete }) {
  const [open, setOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const btnRef = useRef();

  // close on outside click (but allow portal clicks to execute first)
  useEffect(() => {
    const onDoc = (e) => {
      // if click inside the button, ignore
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      // else close (timeout lets portal children handle click handlers first)
      setTimeout(() => setOpen(false), 0);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // compute flip when opening
  useEffect(() => {
    if (!open) return;
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    setFlipUp(spaceBelow < 220);
  }, [open]);

  const onToggle = (e) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={onToggle}
        className="p-1 rounded-full hover:bg-gray-100"
        aria-label="More actions"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>

      {open && btnRef.current && (() => {
        const rect = btnRef.current.getBoundingClientRect();
        return (
          <PortalMenu anchorRect={rect} width={192} flipUp={flipUp} onClose={() => setOpen(false)}>
            <div className="w-full text-left">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => { setOpen(false); onView(job._id); }}
              >
                View
              </button>

              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => { setOpen(false); onEdit(job._id); }}
              >
                Edit
              </button>

              <div className="border-t" />

              <div className="px-2 py-1 text-xs text-gray-500">Change status</div>
              {["pending", "shortlisted", "interview", "rejected"].map((s) => (
                <button
                  key={s}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => { setOpen(false); onChangeStatus(job._id, s); }}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}

              <div className="border-t" />
              <button
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => { setOpen(false); onDelete(job._id); }}
              >
                Delete
              </button>
            </div>
          </PortalMenu>
        );
      })()}
    </div>
  );
}

/* Pagination helper */
function Pagination({ page, pages, onPage }) {
  const left = Math.max(1, page - 1);
  const right = Math.min(pages, page + 1);
  const pagesToShow = [];
  for (let p = left; p <= right; p++) pagesToShow.push(p);

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onPage(1)} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">«</button>
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
      {page > 2 && <span className="px-2">…</span>}
      {pagesToShow.map((p) => (
        <button key={p} onClick={() => onPage(p)} className={`px-3 py-1 border rounded text-sm ${p === page ? "bg-gray-900 text-white" : ""}`}>{p}</button>
      ))}
      {page < pages - 1 && <span className="px-2">…</span>}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
      <button onClick={() => onPage(pages)} disabled={page === pages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">»</button>
    </div>
  );
}

/* MAIN Component */
export default function Jobs() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    console.log("Jobs mounted");
  }, []);

  // controls
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("");
  const [sort, setSort] = useState("-createdAt");

  // which job rows are expanded (show notes/resume)
  const [expanded, setExpanded] = useState(new Set());
  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // debounced search
  const [companyQuery, setCompanyQuery] = useState(company);
  useEffect(() => {
    const t = setTimeout(() => setCompanyQuery(company.trim()), 300);
    return () => clearTimeout(t);
  }, [company]);

  const params = useMemo(() => {
    const p = { page, limit };
    if (status && status !== "all") p.status = status;
    if (companyQuery) p.company = companyQuery;
    if (sort) p.sort = sort;
    return p;
  }, [page, limit, status, companyQuery, sort]);

  const queryKey = ["jobs", params];
  const query = useQuery({
    queryKey,
    queryFn: getJobs,
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  // ----- Mutations -----
  const changeStatusMut = useMutation({
    mutationFn: ({ jobId, status }) => changeJobStatus({ jobId, status }),
    onSuccess: () => {
      qc.invalidateQueries(["jobs"]);
    },
    onError: (err) => {
      console.error("change status error", err);
      alert("Failed to change status");
    },
  });

  const deleteJobMut = useMutation({
    mutationFn: ({ jobId }) => deleteJob({ jobId }),
    onSuccess: () => {
      qc.invalidateQueries(["jobs"]);
    },
    onError: (err) => {
      console.error("delete job error", err);
      alert("Failed to delete job");
    },
  });

  // fallback addInterview mutation kept for other flows (not used in menu)
  const addInterviewMut = useMutation({
    mutationFn: ({ jobId, interview }) => addInterview({ jobId, interview }),
    onSuccess: () => {
      qc.invalidateQueries(["jobs"]);
    },
    onError: (err) => {
      console.error("add interview error", err);
      alert(err?.response?.data?.message || "Failed to add interview (backend may not support this yet)");
    },
  });

  // ----- Handlers wired to UI -----
  // view now navigates to job detail and optionally auto-opens add-interview modal via query param
  const handleView = (jobId) => navigate(`/dashboard/job/${jobId}`);
  const handleEdit = (jobId) => navigate(`/dashboard/job/${jobId}/edit`);

  const handleChangeStatus = (jobId, newStatus) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return;
    changeStatusMut.mutate({ jobId, status: newStatus });
  };

  const handleDelete = (jobId) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    deleteJobMut.mutate({ jobId });
  };

  if (query.isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    const err = query.error;
    const msg = err?.response?.data?.message || err?.message || "Failed to load jobs";
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold">Jobs</h2>
        <div className="mt-4 text-red-600">{msg}</div>
      </div>
    );
  }

  const data = query.data ?? {};
  const jobs = data.jobs ?? [];
  const count = data.count ?? jobs.length;
  const currentPage = data.page ?? page;
  const pages = Math.max(1, Math.ceil(count / limit));

  const clearFilters = () => {
    setPage(1);
    setStatus("all");
    setCompany("");
    setSort("-createdAt");
  };

  return (
    <div className="p-4">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Applied Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">All the roles you’ve applied for</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/job/new")}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            + Add Job
          </button>
          <div className="text-sm text-gray-600">
            {query.isFetching ? "Refreshing…" : `${count} items`}
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="bg-white rounded-md shadow-sm p-3 mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Status</label>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="p-2 border rounded text-sm">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-3 flex-1">
          <input
            value={company}
            onChange={(e) => { setPage(1); setCompany(e.target.value); }}
            placeholder="Search company"
            className="flex-1 p-2 border rounded text-sm"
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <label className="text-sm text-gray-600">Sort</label>
          <select value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }} className="p-2 border rounded text-sm">
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="company">Company A→Z</option>
            <option value="-company">Company Z→A</option>
          </select>

          <button onClick={clearFilters} className="px-3 py-1 border rounded text-sm">Clear</button>
        </div>
      </div>

      {/* responsive table: table on md+, stacked cards on small */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        {/* table for md+ */}
        <table className="min-w-full hidden md:table">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Company</th>
              <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Role</th>
              <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Applied</th>
              <th className="text-left px-3 py-2 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No jobs found</td>
              </tr>
            ) : (
              jobs.map((job) => {
                const isOpen = expanded.has(job._id);
                return (
                  <Fragment key={job._id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="px-3 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium overflow-hidden">
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt={`${job.company} logo`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-700">{job.company?.[0] ?? "C"}</span>
                          )}
                        </div>

                        <div>
                          <div className="font-medium text-sm">{job.company}</div>
                          {job.location && <div className="text-xs text-gray-500">{job.location}</div>}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-medium text-sm">{job.position}</div>
                        {job.salary && <div className="text-sm text-gray-500">{job.salary}</div>}
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge status={job.status} />
                      </td>

                      <td className="px-3 py-3 text-sm text-gray-600">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-3 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <ActionsMenu
                            job={job}
                            onView={handleView}
                            onEdit={handleEdit}
                            onChangeStatus={handleChangeStatus}
                            onDelete={handleDelete}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* expandable row kept (shows notes / resume) when toggled from elsewhere if needed */}
                    {isOpen && (
                      <tr id={`details-${job._id}`} className="bg-gray-50">
                        <td colSpan="5" className="px-3 py-3">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Notes</h4>
                              <Notes jobId={job._id} initialNotes={job.notes || []} />
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-2">Resume</h4>
                              <ResumeUploader jobId={job._1d} resumeKey={job.resumeKey || null} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* mobile stacked cards */}
        <div className="md:hidden p-3 space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500 p-4">No jobs found</div>
          ) : (
            jobs.map((job) => {
              const isOpen = expanded.has(job._id);
              return (
                <div key={job._id} className="border rounded p-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium overflow-hidden">
                        {job.logoUrl ? (
                          <img src={job.logoUrl} alt={`${job.company} logo`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-700">{job.company?.[0] ?? "C"}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{job.company}</div>
                        <div className="text-sm text-gray-500">{job.position}</div>
                      </div>
                    </div>
                    <div><StatusBadge status={job.status} /></div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <div>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}</div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleExpanded(job._id)} className="px-2 py-1 border rounded text-sm">
                        {isOpen ? "Hide" : "Details"}
                      </button>

                      <ActionsMenu
                        job={job}
                        onView={handleView}
                        onEdit={handleEdit}
                        onChangeStatus={handleChangeStatus}
                        onDelete={handleDelete}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t pt-3 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Notes</h4>
                        <Notes jobId={job._id} initialNotes={job.notes || []} />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Resume</h4>
                        <ResumeUploader jobId={job._id} resumeKey={job.resumeKey || null} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, count)} of {count}
        </div>

        <Pagination page={currentPage} pages={pages} onPage={(p) => { setPage(p); }} />
      </div>
    </div>
  );
}
