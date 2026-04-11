import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SupervisorSession {
  supervisorEmail: string;
  supervisorPassword: string;
  supervisorName: string;
  studentId: string;
  studentName: string;
}

export default function SupervisorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/supervisor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      const session: SupervisorSession = {
        supervisorEmail: data.supervisorEmail,
        supervisorPassword: password,
        supervisorName: data.supervisorName,
        studentId: data.studentId,
        studentName: data.studentName,
      };
      localStorage.setItem('supervisorSession', JSON.stringify(session));
      router.push('/supervisor/evaluation');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell py-8 sm:py-10">
      <div className="ambient-blob -left-20 top-12 h-72 w-72 bg-indigo-300/35" />
      <div className="ambient-blob -right-24 top-24 h-80 w-80 bg-violet-300/35" />

      <main className="page-container">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold text-appText sm:text-4xl">Supervisor Login</h1>
            <p className="mt-3 text-base text-appMuted">Log in to submit the employer evaluation.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-card space-y-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div>
              <label className="input-label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-input" placeholder="supervisor@company.com" />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="text-input" placeholder="Your password" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/supervisor/register" className="nav-link">Create account</Link>
            <Link href="/" className="nav-link">Back Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
