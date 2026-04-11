import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(
          "studentSession",
          JSON.stringify({
            studentId: data.studentId,
            email: data.email,
            name: data.name,
            status: data.status,
            finalStatus: data.finalStatus,
            reportSubmittedAt: data.reportSubmittedAt,
            reportDeadline: data.reportDeadline,
            evaluationSubmittedAt: data.evaluationSubmittedAt,
          }),
        );
        router.push("/student/report");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell py-8 sm:py-10">
      <div className="ambient-blob -left-20 top-6 h-72 w-72 bg-indigo-300/40" />
      <div className="ambient-blob -right-20 top-24 h-80 w-80 bg-violet-300/40" />

      <div className="page-container">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-3xl">
              🎓
            </div>
            <h1 className="text-3xl font-extrabold text-appText sm:text-4xl">
              Student Login
            </h1>
            <p className="mt-3 text-base leading-7 text-appMuted">
              Provisionally accepted students can continue to report submission.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="form-card space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-input"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/" className="nav-link">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
