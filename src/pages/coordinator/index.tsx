import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function CoordinatorLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem('coordinatorPassword', password);
        router.push('/coordinator/dashboard');
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell py-8 sm:py-10">
      <div className="ambient-blob -left-20 top-10 h-72 w-72 bg-indigo-300/40" />
      <div className="ambient-blob -right-24 top-20 h-80 w-80 bg-violet-300/40" />

      <div className="page-container">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-3xl">🗂️</div>
            <h1 className="text-3xl font-extrabold text-appText sm:text-4xl">Coordinator Login</h1>
            <p className="mt-3 text-base leading-7 text-appMuted">
              Authenticate to review student applications and reports.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="form-card space-y-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                placeholder="Enter coordinator password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/" className="nav-link">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
