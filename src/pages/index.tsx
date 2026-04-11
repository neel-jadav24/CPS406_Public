import Link from 'next/link';

export default function Home() {
  return (
    <div className="app-shell">
      <div className="ambient-blob -left-28 top-0 h-72 w-72 bg-indigo-300/40" />
      <div className="ambient-blob -right-16 top-20 h-80 w-80 bg-violet-300/40" />

      <main className="page-container page-main">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-sm font-semibold text-brandIndigo">
              CPS406 Co-op Hub
            </p>
            <h1 className="section-title">
              Co-op Support
              <span className="block bg-gradient-to-r from-brandIndigo to-brandViolet bg-clip-text text-transparent">
                Built for Trust
              </span>
            </h1>
            <p className="section-subtitle mt-5 max-w-xl">
              A polished portal where students apply and submit reports while
              coordinators review outcomes with enterprise-grade clarity.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/apply" className="btn-primary">
                Start Application
              </Link>
              <Link href="/student/login" className="btn-secondary">
                Student Portal
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl [perspective:2000px]">
            <div className="surface-card p-6 [transform:rotateX(5deg)_rotateY(-12deg)] hover:[transform:rotateX(2deg)_rotateY(-8deg)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-appMuted">
                Application Overview
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-appBorder bg-indigo-50/70 p-3">
                  <p className="text-sm font-semibold text-brandIndigo">Pending Queue</p>
                  <p className="text-2xl font-bold text-appText">12 Students</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-appBorder p-3">
                    <p className="text-xs text-appMuted">Accepted</p>
                    <p className="text-xl font-bold text-emerald-600">08</p>
                  </div>
                  <div className="rounded-lg border border-appBorder p-3">
                    <p className="text-xs text-appMuted">Reports In</p>
                    <p className="text-xl font-bold text-brandIndigo">06</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-xl border border-white/40 bg-gradient-to-r from-brandIndigo to-brandViolet px-4 py-2 text-sm font-semibold text-white shadow-brand-btn animate-float sm:block">
              Live Coordinator View
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/apply" className="surface-card block p-6">
            <span className="feature-icon mb-4">📝</span>
            <h2 className="text-xl font-bold text-appText">Application Intake</h2>
            <p className="mt-2 text-sm text-appMuted">
              Fast student onboarding with clear validation and status tracking.
            </p>
          </Link>
          <Link href="/student/login" className="surface-card block p-6">
            <span className="feature-icon mb-4">🎓</span>
            <h2 className="text-xl font-bold text-appText">Student Reporting</h2>
            <p className="mt-2 text-sm text-appMuted">
              Secure report upload flow built for reliable submission updates.
            </p>
          </Link>
          <Link href="/coordinator" className="surface-card block p-6">
            <span className="feature-icon mb-4">🗂️</span>
            <h2 className="text-xl font-bold text-appText">Coordinator Control</h2>
            <p className="mt-2 text-sm text-appMuted">
              Review, accept/reject, and manage final decisions in one workspace.
            </p>
          </Link>
          <Link href="/supervisor/login" className="surface-card block p-6">
            <span className="feature-icon mb-4">🏢</span>
            <h2 className="text-xl font-bold text-appText">Supervisor Evaluation</h2>
            <p className="mt-2 text-sm text-appMuted">
              Register supervisor accounts and submit evaluations by PDF or online form.
            </p>
          </Link>
          <Link href="/coordinator/reports" className="surface-card block p-6 md:col-span-2 xl:col-span-4">
            <span className="feature-icon mb-4">📊</span>
            <h2 className="text-xl font-bold text-appText">Reporting Dashboard</h2>
            <p className="mt-2 text-sm text-appMuted">
              Track provisional/final decisions, missing reports/evaluations, overdue submissions, and reminder history.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}
