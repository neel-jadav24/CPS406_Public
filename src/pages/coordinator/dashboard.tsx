import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

interface Application {
  id: string;
  name: string;
  studentId: string;
  email: string;
  status: "Pending" | "Provisionally Accepted" | "Provisionally Rejected";
  finalStatus: "Pending Final Review" | "Final Accepted" | "Final Rejected";
  placementStatus: "Active" | "Rejected From Placement";
  createdAt: string;
  reportDeadline: string | null;
  reportPath: string | null;
  reportSubmittedAt: string | null;
  evaluationSubmittedAt: string | null;
  evaluationMethod: "None" | "PDF" | "Online Form";
  evaluationPdfPath: string | null;
  evaluationOnline: {
    behaviour: number | null;
    skills: number | null;
    knowledge: number | null;
    attitude: number | null;
    comments: string;
  } | null;
  reminderSentAt: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "Provisionally Accepted": "bg-emerald-100 text-emerald-700",
  "Provisionally Rejected": "bg-rose-100 text-rose-700",
};

const FINAL_BADGE: Record<string, string> = {
  "Pending Final Review": "bg-slate-100 text-slate-700",
  "Final Accepted": "bg-emerald-100 text-emerald-700",
  "Final Rejected": "bg-rose-100 text-rose-700",
};

const PLACEMENT_BADGE: Record<string, string> = {
  Active: "bg-indigo-100 text-indigo-700",
  "Rejected From Placement": "bg-rose-100 text-rose-700",
};

type AppPatchPayload = {
  status?: Application["status"];
  finalStatus?: Application["finalStatus"];
  placementStatus?: Application["placementStatus"];
  reportDeadline?: string | null;
  sendReminder?: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deadlineDrafts, setDeadlineDrafts] = useState<Record<string, string>>(
    {},
  );
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<Application | null>(null);

  const fetchApplications = useCallback(
    async (password: string) => {
      try {
        const res = await fetch("/api/applications", {
          headers: { "x-coordinator-password": password },
        });
        if (res.status === 401) {
          localStorage.removeItem("coordinatorPassword");
          router.push("/coordinator");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setApplications(data);
        const drafts: Record<string, string> = {};
        (data as Application[]).forEach((app) => {
          drafts[app.id] = app.reportDeadline
            ? app.reportDeadline.slice(0, 10)
            : "";
        });
        setDeadlineDrafts(drafts);
      } catch {
        setError("Failed to load applications.");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const password = localStorage.getItem("coordinatorPassword");
    if (!password) {
      router.push("/coordinator");
      return;
    }
    fetchApplications(password);
  }, [router, fetchApplications]);

  async function patchApplication(id: string, payload: AppPatchPayload) {
    const password = localStorage.getItem("coordinatorPassword");
    if (!password) return;
    setUpdating(id);
    setError("");
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-coordinator-password": password,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
        if (updated.reportDeadline) {
          setDeadlineDrafts((prev) => ({
            ...prev,
            [id]: updated.reportDeadline.slice(0, 10),
          }));
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update application.");
      }
    } catch {
      setError("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  }

  async function downloadReport(appId: string, appName: string) {
    const password = localStorage.getItem("coordinatorPassword");
    if (!password) return;
    try {
      const res = await fetch(`/api/reports/download/${appId}`, {
        headers: { "x-coordinator-password": password },
      });
      if (!res.ok) {
        setError("Failed to download report");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${appName.replace(/\s+/g, "_")}_Report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download report");
    }
  }

  async function openEvaluation(app: Application) {
    if (app.evaluationMethod === "PDF" && app.evaluationPdfPath) {
      const password = localStorage.getItem("coordinatorPassword");
      if (!password) return;

      try {
        const res = await fetch(`/api/evaluations/download/${app.id}`, {
          headers: { "x-coordinator-password": password },
        });
        if (!res.ok) {
          setError("Failed to open evaluation PDF");
          return;
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 30000);
        return;
      } catch {
        setError("Failed to open evaluation PDF");
        return;
      }
    }

    setSelectedEvaluation(app);
  }

  function handleLogout() {
    localStorage.removeItem("coordinatorPassword");
    router.push("/");
  }

  const counts = {
    pending: applications.filter((a) => a.status === "Pending").length,
    provisionalAccepted: applications.filter(
      (a) => a.status === "Provisionally Accepted",
    ).length,
    finalAccepted: applications.filter(
      (a) => a.finalStatus === "Final Accepted",
    ).length,
    missingReports: applications.filter(
      (a) =>
        a.status === "Provisionally Accepted" &&
        a.finalStatus === "Final Accepted" &&
        !a.reportSubmittedAt,
    ).length,
    missingEvaluations: applications.filter(
      (a) =>
        a.status === "Provisionally Accepted" &&
        a.finalStatus === "Final Accepted" &&
        !a.evaluationSubmittedAt,
    ).length,
  };

  return (
    <div className="app-shell">
      <div className="ambient-blob -left-24 top-12 h-72 w-72 bg-indigo-300/35" />
      <div className="ambient-blob -right-24 top-20 h-80 w-80 bg-violet-300/35" />

      <nav className="top-nav">
        <div className="page-container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="nav-link">
              ← Home
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-slate-700">
              Coordinator Dashboard
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary min-h-0 px-3 py-1.5 text-xs"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="page-container page-main-compact">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-appText sm:text-5xl">
              Application
              <span className="block bg-gradient-to-r from-brandIndigo to-brandViolet bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-appMuted">
              Review candidates, manage provisional and final outcomes, and
              track report/evaluation completion.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-brandIndigo">
              {applications.length} total
            </span>
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {counts.pending} pending
            </span>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {counts.provisionalAccepted} provisionally accepted
            </span>
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {counts.finalAccepted} final accepted
            </span>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
              Missing Reports
            </p>
            <p className="mt-2 text-2xl font-bold text-appText">
              {counts.missingReports}
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
              Missing Evaluations
            </p>
            <p className="mt-2 text-2xl font-bold text-appText">
              {counts.missingEvaluations}
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
              Reports View
            </p>
            <Link
              href="/coordinator/reports"
              className="mt-2 inline-flex text-sm font-semibold text-brandIndigo hover:text-brandViolet"
            >
              Open Reporting Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="surface-card p-8 text-center text-appMuted">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <div className="mb-3 text-4xl">📭</div>
            <p className="text-appMuted">No applications submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const isOverdue =
                app.status === "Provisionally Accepted" &&
                !app.reportSubmittedAt &&
                !!app.reportDeadline &&
                new Date(app.reportDeadline) < new Date();

              return (
                <article key={app.id} className="surface-card p-5">
                  <div className="grid gap-4 lg:grid-cols-4">
                    <div>
                      <h2 className="text-lg font-bold text-appText">
                        {app.name}
                      </h2>
                      <p className="text-sm text-appMuted">
                        Student ID: {app.studentId}
                      </p>
                      <p className="text-sm text-appMuted">{app.email}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                        Statuses
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`status-chip ${STATUS_BADGE[app.status] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {app.status}
                        </span>
                        <span
                          className={`status-chip ${FINAL_BADGE[app.finalStatus] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {app.finalStatus}
                        </span>
                        <span
                          className={`status-chip ${PLACEMENT_BADGE[app.placementStatus] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {app.placementStatus}
                        </span>
                      </div>
                      <p className="text-xs text-appMuted">
                        Report:{" "}
                        {app.reportSubmittedAt
                          ? new Date(app.reportSubmittedAt).toLocaleDateString()
                          : "Missing"}
                      </p>
                      {app.reportSubmittedAt && (
                        <button
                          onClick={() => downloadReport(app.id, app.name)}
                          className="btn-secondary text-xs w-full"
                        >
                          Download Report
                        </button>
                      )}
                      <p className="text-xs text-appMuted">
                        Evaluation:{" "}
                        {app.evaluationSubmittedAt
                          ? new Date(
                              app.evaluationSubmittedAt,
                            ).toLocaleDateString()
                          : "Missing"}
                      </p>
                      {app.evaluationSubmittedAt && (
                        <button
                          onClick={() => openEvaluation(app)}
                          className="btn-secondary text-xs w-full"
                        >
                          View Evaluation
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="input-label">Provisional Status</label>
                      <select
                        value={app.status}
                        onChange={(e) =>
                          patchApplication(app.id, {
                            status: e.target.value as Application["status"],
                          })
                        }
                        disabled={updating === app.id}
                        className="text-input"
                      >
                        <option>Pending</option>
                        <option>Provisionally Accepted</option>
                        <option>Provisionally Rejected</option>
                      </select>

                      <label className="input-label">Final Status</label>
                      <select
                        value={app.finalStatus}
                        onChange={(e) =>
                          patchApplication(app.id, {
                            finalStatus: e.target
                              .value as Application["finalStatus"],
                          })
                        }
                        disabled={updating === app.id}
                        className="text-input"
                      >
                        <option>Pending Final Review</option>
                        <option>Final Accepted</option>
                        <option>Final Rejected</option>
                      </select>

                      <label className="input-label">Placement</label>
                      <select
                        value={app.placementStatus}
                        onChange={(e) =>
                          patchApplication(app.id, {
                            placementStatus: e.target
                              .value as Application["placementStatus"],
                          })
                        }
                        disabled={updating === app.id}
                        className="text-input"
                      >
                        <option>Active</option>
                        <option>Rejected From Placement</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="input-label">Report Deadline</label>
                      <input
                        type="date"
                        value={deadlineDrafts[app.id] ?? ""}
                        onChange={(e) =>
                          setDeadlineDrafts((prev) => ({
                            ...prev,
                            [app.id]: e.target.value,
                          }))
                        }
                        className="text-input"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          patchApplication(app.id, {
                            reportDeadline: deadlineDrafts[app.id] || null,
                          })
                        }
                        disabled={updating === app.id}
                        className="btn-secondary w-full"
                      >
                        Save Deadline
                      </button>

                      {isOverdue && (
                        <button
                          type="button"
                          onClick={() =>
                            patchApplication(app.id, { sendReminder: true })
                          }
                          disabled={updating === app.id}
                          className="btn-primary w-full"
                        >
                          Send Reminder
                        </button>
                      )}

                      <p className="text-xs text-appMuted">
                        Reminder:{" "}
                        {app.reminderSentAt
                          ? new Date(app.reminderSentAt).toLocaleString()
                          : "Not sent"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selectedEvaluation &&
          selectedEvaluation.evaluationMethod === "Online Form" &&
          selectedEvaluation.evaluationOnline && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-appText">
                      Supervisor Evaluation
                    </h3>
                    <p className="mt-1 text-sm text-appMuted">
                      {selectedEvaluation.name} ({selectedEvaluation.studentId})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEvaluation(null)}
                    className="btn-secondary min-h-0 px-3 py-1.5 text-xs"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="surface-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                      Method
                    </p>
                    <p className="mt-1 text-sm font-semibold text-appText">
                      Online Form
                    </p>
                  </div>
                  <div className="surface-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                      Submitted
                    </p>
                    <p className="mt-1 text-sm font-semibold text-appText">
                      {selectedEvaluation.evaluationSubmittedAt
                        ? new Date(
                            selectedEvaluation.evaluationSubmittedAt,
                          ).toLocaleString()
                        : "n/a"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {(
                    [
                      [
                        "Behaviour",
                        selectedEvaluation.evaluationOnline.behaviour,
                      ],
                      ["Skills", selectedEvaluation.evaluationOnline.skills],
                      [
                        "Knowledge",
                        selectedEvaluation.evaluationOnline.knowledge,
                      ],
                      [
                        "Attitude",
                        selectedEvaluation.evaluationOnline.attitude,
                      ],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="surface-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-appText">
                        {value ?? "n/a"} / 5
                      </p>
                    </div>
                  ))}
                  <div className="surface-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                      Comments
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-appText">
                      {selectedEvaluation.evaluationOnline.comments ||
                        "No comments provided."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
