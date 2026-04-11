import { useState } from "react";
import Link from "next/link";

export default function SupervisorRegister() {
  const [studentEmail, setStudentEmail] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !studentEmail.trim() ||
      !supervisorName.trim() ||
      !supervisorEmail.trim() ||
      !password.trim()
    ) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/supervisor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail,
          supervisorName,
          supervisorEmail,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      setSuccess(
        `Account created for ${data.supervisorName}. You can now log in.`,
      );
      setStudentEmail("");
      setSupervisorName("");
      setSupervisorEmail("");
      setPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell py-8 sm:py-10">
      <div className="ambient-blob -left-20 top-12 h-72 w-72 bg-indigo-300/35" />
      <div className="ambient-blob -right-24 top-24 h-80 w-80 bg-violet-300/35" />

      <main className="page-container">
        <div className="mx-auto max-w-xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold text-appText sm:text-4xl">
              Supervisor Account Setup
            </h1>
            <p className="mt-3 text-base text-appMuted">
              Create an account to submit employer evaluations. Enter the
              student\'s email address and your supervisor information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="form-card space-y-4">
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
              <label className="input-label">Student Email</label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="text-input"
                placeholder="student@email.com"
              />
            </div>

            <div>
              <label className="input-label">Supervisor Name</label>
              <input
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="text-input"
                placeholder="Jordan Smith"
              />
            </div>

            <div>
              <label className="input-label">Supervisor Email</label>
              <input
                type="email"
                value={supervisorEmail}
                onChange={(e) => setSupervisorEmail(e.target.value)}
                className="text-input"
                placeholder="supervisor@company.com"
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Creating Account..." : "Create Supervisor Account"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/supervisor/login" className="nav-link">
              Already have an account? Login
            </Link>
            <Link href="/" className="nav-link">
              Back Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
