import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

interface StudentSession {
  studentId: string;
  email: string;
  name: string;
  status: string;
  finalStatus: string;
  reportSubmittedAt: string | null;
  reportDeadline: string | null;
  evaluationSubmittedAt: string | null;
}

interface ApplicationInfo {
  reportSubmittedAt: string | null;
  reportDeadline: string | null;
  finalStatus: string;
  status: string;
  evaluationSubmittedAt: string | null;
}

export default function Report() {
  const router = useRouter();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [appInfo, setAppInfo] = useState<ApplicationInfo>({
    reportSubmittedAt: null,
    reportDeadline: null,
    finalStatus: "Pending Final Review",
    status: "Pending",
    evaluationSubmittedAt: null,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("studentSession");
    if (!raw) {
      router.push("/student/login");
      return;
    }
    const s = JSON.parse(raw) as StudentSession;
    setSession(s);
    setAppInfo({
      reportSubmittedAt: s.reportSubmittedAt,
      reportDeadline: s.reportDeadline,
      finalStatus: s.finalStatus,
      status: s.status,
      evaluationSubmittedAt: s.evaluationSubmittedAt,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchReportInfo(s: StudentSession) {
    try {
      const res = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: s.studentId, email: s.email }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppInfo({
          reportSubmittedAt: data.reportSubmittedAt,
          reportDeadline: data.reportDeadline ?? null,
          finalStatus: data.finalStatus ?? "Pending Final Review",
          status: data.status ?? "Pending",
          evaluationSubmittedAt: data.evaluationSubmittedAt ?? null,
        });
      } else {
        localStorage.removeItem("studentSession");
        router.push("/student/login");
      }
    } catch {
      // ignore
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !session) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("report", file);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "x-student-email": session.email,
        },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess("Report uploaded successfully!");
        setFile(null);
        setAppInfo((prev) => ({
          ...prev,
          reportSubmittedAt: data.reportSubmittedAt,
        }));
      } else {
        const data = await res.json();
        setError(data.error || "Upload failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("studentSession");
    router.push("/");
  }

  if (!session) return null;

  const deadlinePassed =
    !!appInfo.reportDeadline &&
    !appInfo.reportSubmittedAt &&
    new Date(appInfo.reportDeadline) < new Date();

  return (
    <div className="app-shell">
      <div className="ambient-blob -left-20 top-10 h-72 w-72 bg-indigo-300/35" />
      <div className="ambient-blob -right-20 top-20 h-80 w-80 bg-violet-300/35" />

      <nav className="top-nav">
        <div className="page-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="nav-link">
              ← Home
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-slate-700">
              Student Portal
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
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="section-title">Work-term Report</h1>
            <p className="section-subtitle mt-3">
              Welcome back,{" "}
              <span className="font-semibold text-appText">{session.name}</span>
              . Upload or replace your report PDF below.
            </p>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                Final Decision
              </p>
              <p className="mt-1 text-base font-semibold text-appText">
                {appInfo.finalStatus}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                Report Deadline
              </p>
              <p className="mt-1 text-base font-semibold text-appText">
                {appInfo.reportDeadline
                  ? new Date(appInfo.reportDeadline).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>
          </div>

          {appInfo.reportSubmittedAt && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <p className="font-semibold">✓ Report already submitted</p>
              <p className="mt-1 text-sm">
                Submitted on:{" "}
                {new Date(appInfo.reportSubmittedAt).toLocaleString()}
              </p>
            </div>
          )}

          {deadlinePassed && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-semibold">Report deadline has passed.</p>
              <p className="mt-1 text-sm">
                Please contact your co-op coordinator for an extension.
              </p>
            </div>
          )}

          {appInfo.evaluationSubmittedAt && (
            <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-700">
              <p className="font-semibold">Employer evaluation received.</p>
              <p className="mt-1 text-sm">
                Submitted on:{" "}
                {new Date(appInfo.evaluationSubmittedAt).toLocaleString()}
              </p>
            </div>
          )}

          <form onSubmit={handleUpload} className="form-card space-y-4">
            <h2 className="text-xl font-bold text-appText">
              {appInfo.reportSubmittedAt ? "Replace Report" : "Upload Report"}
            </h2>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}
            <div>
              <label className="input-label">
                PDF Report <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="helper-text mt-1">Only PDF files are accepted.</p>
            </div>
            <button
              type="submit"
              disabled={uploading || !file || deadlinePassed}
              className="btn-primary w-full"
            >
              {uploading ? "Uploading..." : "Upload Report"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
