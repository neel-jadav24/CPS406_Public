import { useState } from "react";
import Link from "next/link";

interface FormData {
  name: string;
  studentId: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  studentId?: string;
  email?: string;
  password?: string;
}

export default function Apply() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    studentId: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.studentId.trim())
      newErrors.studentId = "Student ID is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setFormData({ name: "", studentId: "", email: "", password: "" });
      } else {
        const data = await res.json();
        setServerError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="app-shell py-8 sm:py-10">
        <div className="ambient-blob left-0 top-10 h-72 w-72 bg-indigo-300/40" />
        <div className="ambient-blob right-0 top-16 h-72 w-72 bg-violet-300/40" />
        <div className="page-container">
          <div className="mx-auto max-w-2xl rounded-xl bg-gradient-to-r from-indigo-900 to-indigo-950 p-[1px] shadow-soft-lg">
            <div className="rounded-xl bg-white p-8 text-center sm:p-10">
              <div className="mb-4 text-5xl">✅</div>
              <h2 className="text-3xl font-extrabold text-appText">
                Application Submitted
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-appMuted">
                Your application is now in review. Current status:
                <span className="ml-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Pending
                </span>
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => setSuccess(false)}
                  className="btn-primary"
                >
                  Submit Another
                </button>
                <Link href="/" className="btn-secondary">
                  Back Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient-blob -left-20 top-10 h-72 w-72 bg-indigo-300/40" />
      <div className="ambient-blob -right-16 top-32 h-72 w-72 bg-violet-300/40" />

      <nav className="top-nav">
        <div className="page-container flex h-14 items-center">
          <Link href="/" className="nav-link">
            ← Home
          </Link>
        </div>
      </nav>

      <main className="page-container page-main-compact">
        <div className="mx-auto max-w-2xl">
          <h1 className="section-title text-center">Co-op Application</h1>
          <p className="section-subtitle mx-auto mt-2 max-w-xl text-center">
            Share your details to start your placement journey.
          </p>

          <form onSubmit={handleSubmit} className="form-card mt-6 space-y-4">
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}
            <div>
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`text-input ${errors.name ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500" : ""}`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="input-label">Student ID *</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({ ...formData, studentId: e.target.value })
                }
                className={`text-input ${errors.studentId ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500" : ""}`}
                placeholder="123456789"
              />
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
              )}
            </div>
            <div>
              <label className="input-label">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`text-input ${errors.email ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500" : ""}`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="input-label">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`text-input ${errors.password ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500" : ""}`}
                placeholder="At least 6 characters"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
              <Link href="/" className="btn-secondary flex-1">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
