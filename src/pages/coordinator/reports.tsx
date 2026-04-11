import { useEffect, useState } from "react";
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
  reportDeadline: string | null;
  reminderSentAt: string | null;
}

interface SummaryResponse {
  totals: {
    applications: number;
    pending: number;
    provisionallyAccepted: number;
    provisionallyRejected: number;
    finalAccepted: number;
    finalRejected: number;
    placementRejected: number;
    reportsSubmitted: number;
    reportsMissing: number;
    evaluationsSubmitted: number;
    evaluationsMissing: number;
    overdueReports: number;
  };
  overdueStudents: Array<{
    id: string;
    name: string;
    email: string;
    studentId: string;
    reportDeadline: string | null;
    reminderSentAt: string | null;
  }>;
}

export default function CoordinatorReports() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<Application | null>(null);

  useEffect(() => {
    const password = localStorage.getItem("coordinatorPassword");
    if (!password) {
      router.push("/coordinator");
      return;
    }
    const coordinatorPassword = password;

    async function loadData() {
      try {
        const [summaryRes, appsRes] = await Promise.all([
          fetch("/api/reports/summary", {
            headers: { "x-coordinator-password": coordinatorPassword },
          }),
          fetch("/api/applications", {
            headers: { "x-coordinator-password": coordinatorPassword },
          }),
        ]);

        if (summaryRes.status === 401 || appsRes.status === 401) {
          localStorage.removeItem("coordinatorPassword");
          router.push("/coordinator");
          return;
        }

        if (!summaryRes.ok || !appsRes.ok) {
          throw new Error("Failed to load reporting data");
        }

        setSummary(await summaryRes.json());
        setApplications(await appsRes.json());
      } catch {
        setError("Failed to load reporting dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("coordinatorPassword");
    router.push("/");
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

  async function viewEvaluation(app: Application) {
    setSelectedEvaluation(app);
  }

  async function openSelectedEvaluationPdf() {
    if (!selectedEvaluation) return;

    const password = localStorage.getItem("coordinatorPassword");
    if (!password) return;

    try {
      const res = await fetch(
        `/api/evaluations/download/${selectedEvaluation.id}`,
        {
          headers: { "x-coordinator-password": password },
        },
      );
      if (!res.ok) {
        setError("Failed to load evaluation PDF");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch {
      setError("Failed to load evaluation PDF");
    }
  }

  const provisionalAccepted = applications.filter(
    (a) =>
      a.status === "Provisionally Accepted" &&
      a.finalStatus === "Final Accepted",
  );
  const provisionalRejected = applications.filter(
    (a) => a.status === "Provisionally Rejected",
  );
  const finalAccepted = applications.filter(
    (a) => a.finalStatus === "Final Accepted",
  );
  const finalRejected = applications.filter(
    (a) => a.finalStatus === "Final Rejected",
  );
  const missingReports = provisionalAccepted.filter(
    (a) => !a.reportSubmittedAt,
  );
  const missingEvaluations = provisionalAccepted.filter(
    (a) => !a.evaluationSubmittedAt,
  );
  const submittedEvaluations = applications.filter(
    (a) => a.evaluationSubmittedAt,
  );

  return (
    <div className="app-shell">
      <div className="ambient-blob -left-24 top-10 h-72 w-72 bg-indigo-300/35" />
      <div className="ambient-blob -right-20 top-20 h-80 w-80 bg-violet-300/35" />

      <nav className="top-nav">
        <div className="page-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/coordinator/dashboard" className="nav-link">
              ← Dashboard
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-slate-700">
              Reporting Dashboard
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
        <div className="mb-6">
          <h1 className="section-title">Program Reporting</h1>
          <p className="section-subtitle mt-3">
            Overview of application decisions and missing submissions.
          </p>
        </div>

        {loading ? (
          <div className="surface-card p-12 text-center text-appMuted">
            Loading report metrics...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : summary ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Total Applications</p>
                <p className="text-2xl font-bold text-appText">
                  {summary.totals.applications}
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Provisionally Accepted</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {summary.totals.provisionallyAccepted}
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Final Accepted</p>
                <p className="text-2xl font-bold text-indigo-700">
                  {summary.totals.finalAccepted}
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Placement Rejected</p>
                <p className="text-2xl font-bold text-rose-700">
                  {summary.totals.placementRejected}
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Reports Missing</p>
                <p className="text-2xl font-bold text-amber-700">
                  {summary.totals.reportsMissing}
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Evaluations Missing</p>
                <p className="text-2xl font-bold text-amber-700">
                  {summary.totals.evaluationsMissing}
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Overdue Reports</p>
                <p className="text-2xl font-bold text-rose-700">
                  {summary.totals.overdueReports}
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-xs text-appMuted">Final Rejected</p>
                <p className="text-2xl font-bold text-rose-700">
                  {summary.totals.finalRejected}
                </p>
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="surface-card p-5">
                <h2 className="text-lg font-bold text-appText">
                  Provisionally Accepted
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-appMuted">
                  {provisionalAccepted.length === 0 ? (
                    <li>None</li>
                  ) : (
                    provisionalAccepted.map((a) => (
                      <li key={a.id}>
                        {a.name} ({a.studentId})
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="surface-card p-5">
                <h2 className="text-lg font-bold text-appText">
                  Provisionally Rejected
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-appMuted">
                  {provisionalRejected.length === 0 ? (
                    <li>None</li>
                  ) : (
                    provisionalRejected.map((a) => (
                      <li key={a.id}>
                        {a.name} ({a.studentId})
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="surface-card p-5">
                <h2 className="text-lg font-bold text-appText">
                  Final Accepted
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-appMuted">
                  {finalAccepted.length === 0 ? (
                    <li>None</li>
                  ) : (
                    finalAccepted.map((a) => (
                      <li key={a.id}>
                        {a.name} ({a.studentId})
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="surface-card p-5">
                <h2 className="text-lg font-bold text-appText">
                  Final Rejected
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-appMuted">
                  {finalRejected.length === 0 ? (
                    <li>None</li>
                  ) : (
                    finalRejected.map((a) => (
                      <li key={a.id}>
                        {a.name} ({a.studentId})
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="surface-card p-5">
                <h2 className="text-lg font-bold text-appText">
                  Students Missing Reports
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-appMuted">
                  {missingReports.length === 0 ? (
                    <li>None</li>
                  ) : (
                    missingReports.map((a) => (
                      <li key={a.id}>
                        {a.name} ({a.studentId})
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="surface-card p-5">
                <h2 className="text-lg font-bold text-appText">
                  Students Missing Evaluations
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-appMuted">
                  {missingEvaluations.length === 0 ? (
                    <li>None</li>
                  ) : (
                    missingEvaluations.map((a) => (
                      <li key={a.id}>
                        {a.name} ({a.studentId})
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </section>

            <section className="mt-6 surface-card p-5">
              <h2 className="text-lg font-bold text-appText">
                Overdue Report Reminders
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-appMuted">
                {summary.overdueStudents.length === 0 ? (
                  <li>No overdue reports.</li>
                ) : (
                  summary.overdueStudents.map((s) => (
                    <li key={s.id}>
                      {s.name} ({s.studentId}) - deadline{" "}
                      {s.reportDeadline
                        ? new Date(s.reportDeadline).toLocaleDateString()
                        : "n/a"}{" "}
                      - reminder{" "}
                      {s.reminderSentAt
                        ? new Date(s.reminderSentAt).toLocaleString()
                        : "not sent"}
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="mt-6 surface-card p-5">
              <h2 className="text-lg font-bold text-appText">
                Submitted Reports
              </h2>
              <div className="mt-3 space-y-2">
                {applications.filter((a) => a.reportSubmittedAt).length ===
                0 ? (
                  <p className="text-sm text-appMuted">
                    No reports submitted yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Student Name
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Student ID
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Submitted
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications
                          .filter((a) => a.reportSubmittedAt)
                          .map((a) => (
                            <tr
                              key={a.id}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="py-2 px-3 text-appMuted">
                                {a.name}
                              </td>
                              <td className="py-2 px-3 text-appMuted">
                                {a.studentId}
                              </td>
                              <td className="py-2 px-3 text-appMuted">
                                {new Date(
                                  a.reportSubmittedAt!,
                                ).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-3">
                                <button
                                  onClick={() => downloadReport(a.id, a.name)}
                                  className="btn-secondary text-xs px-2 py-1"
                                >
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 surface-card p-5">
              <h2 className="text-lg font-bold text-appText">
                Submitted Evaluations
              </h2>
              <div className="mt-3 space-y-2">
                {submittedEvaluations.length === 0 ? (
                  <p className="text-sm text-appMuted">
                    No evaluations submitted yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Student Name
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Student ID
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Method
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Submitted
                          </th>
                          <th className="text-left py-2 px-3 font-semibold text-appText">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {submittedEvaluations.map((a) => (
                          <tr
                            key={a.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3 text-appMuted">
                              {a.name}
                            </td>
                            <td className="py-2 px-3 text-appMuted">
                              {a.studentId}
                            </td>
                            <td className="py-2 px-3 text-appMuted">
                              {a.evaluationMethod}
                            </td>
                            <td className="py-2 px-3 text-appMuted">
                              {new Date(
                                a.evaluationSubmittedAt!,
                              ).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => viewEvaluation(a)}
                                className="btn-secondary text-xs px-2 py-1"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {selectedEvaluation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
                <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-appText">
                        Supervisor Evaluation
                      </h3>
                      <p className="mt-1 text-sm text-appMuted">
                        {selectedEvaluation.name} (
                        {selectedEvaluation.studentId})
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
                        {selectedEvaluation.evaluationMethod}
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

                  {selectedEvaluation.evaluationMethod === "PDF" ? (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-appMuted">
                      <p>The evaluation was submitted as a PDF.</p>
                      <button
                        onClick={openSelectedEvaluationPdf}
                        className="btn-primary mt-3"
                      >
                        Open PDF
                      </button>
                    </div>
                  ) : selectedEvaluation.evaluationOnline ? (
                    <div className="mt-5 space-y-3">
                      {(
                        [
                          [
                            "Behaviour",
                            selectedEvaluation.evaluationOnline.behaviour,
                          ],
                          [
                            "Skills",
                            selectedEvaluation.evaluationOnline.skills,
                          ],
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
                  ) : (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-appMuted">
                      No evaluation details available.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
