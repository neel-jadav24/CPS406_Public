import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SupervisorSession {
  supervisorEmail: string;
  supervisorPassword: string;
  supervisorName: string;
  studentId: string;
  studentName: string;
}

interface OnlineFormState {
  behaviour: number;
  skills: number;
  knowledge: number;
  attitude: number;
  comments: string;
}

export default function SupervisorEvaluation() {
  const router = useRouter();
  const [session, setSession] = useState<SupervisorSession | null>(null);
  const [mode, setMode] = useState<'pdf' | 'online'>('online');
  const [file, setFile] = useState<File | null>(null);
  const [online, setOnline] = useState<OnlineFormState>({
    behaviour: 3,
    skills: 3,
    knowledge: 3,
    attitude: 3,
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('supervisorSession');
    if (!raw) {
      router.push('/supervisor/login');
      return;
    }
    setSession(JSON.parse(raw) as SupervisorSession);
  }, [router]);

  async function handleSubmitPdf(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !file) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('evaluation', file);
      const res = await fetch('/api/evaluations/upload', {
        method: 'POST',
        headers: {
          'x-supervisor-email': session.supervisorEmail,
          'x-supervisor-password': session.supervisorPassword,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed.');
        return;
      }
      setSuccess(`Evaluation submitted successfully at ${new Date(data.evaluationSubmittedAt).toLocaleString()}.`);
      setFile(null);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitOnline(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/evaluations/online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-supervisor-email': session.supervisorEmail,
          'x-supervisor-password': session.supervisorPassword,
        },
        body: JSON.stringify(online),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed.');
        return;
      }
      setSuccess(`Evaluation submitted successfully at ${new Date(data.evaluationSubmittedAt).toLocaleString()}.`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('supervisorSession');
    router.push('/supervisor/login');
  }

  if (!session) return null;

  return (
    <div className="app-shell">
      <div className="ambient-blob -left-20 top-12 h-72 w-72 bg-indigo-300/35" />
      <div className="ambient-blob -right-24 top-24 h-80 w-80 bg-violet-300/35" />

      <nav className="top-nav">
        <div className="page-container flex h-16 items-center justify-between">
          <div className="text-sm text-slate-600">Supervisor: <span className="font-semibold text-appText">{session.supervisorName}</span></div>
          <button onClick={handleLogout} className="btn-secondary min-h-0 px-3 py-1.5 text-xs">Logout</button>
        </div>
      </nav>

      <main className="page-container page-main-compact">
        <div className="mx-auto max-w-3xl">
          <h1 className="section-title">Employer Evaluation</h1>
          <p className="section-subtitle mt-3">
            Student: <span className="font-semibold text-appText">{session.studentName}</span> ({session.studentId})
          </p>

          <div className="mt-6 inline-flex rounded-lg border border-appBorder bg-white p-1">
            <button
              type="button"
              onClick={() => setMode('online')}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === 'online' ? 'bg-gradient-to-r from-brandIndigo to-brandViolet text-white' : 'text-slate-600'}`}
            >
              Online Form
            </button>
            <button
              type="button"
              onClick={() => setMode('pdf')}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === 'pdf' ? 'bg-gradient-to-r from-brandIndigo to-brandViolet text-white' : 'text-slate-600'}`}
            >
              Upload PDF
            </button>
          </div>

          <div className="mt-4 form-card">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            {mode === 'online' ? (
              <form onSubmit={handleSubmitOnline} className="space-y-4">
                {(['behaviour', 'skills', 'knowledge', 'attitude'] as const).map((key) => (
                  <div key={key}>
                    <label className="input-label capitalize">{key} (1-5)</label>
                    <select
                      value={online[key]}
                      onChange={(e) => setOnline((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="text-input"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="input-label">Comments</label>
                  <textarea
                    value={online.comments}
                    onChange={(e) => setOnline((prev) => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                    className="text-input"
                    placeholder="Provide context and recommendations"
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Submitting...' : 'Submit Online Evaluation'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitPdf} className="space-y-4">
                <div>
                  <label className="input-label">Evaluation PDF</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <button type="submit" disabled={submitting || !file} className="btn-primary w-full">
                  {submitting ? 'Uploading...' : 'Upload Evaluation PDF'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/" className="nav-link">Back Home</Link>
            <Link href="/coordinator/reports" className="nav-link">View Reporting Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
