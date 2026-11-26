import Link from "next/link";

const publicModules = [
  {
    mark: "C",
    title: "Customers",
    description: "Keep customer information organized in one place.",
  },
  {
    mark: "P",
    title: "Products",
    description: "Manage products and pricing with clarity.",
  },
  {
    mark: "HR",
    title: "Human Resources",
    description: "Support your people and their work.",
  },
  {
    mark: "S",
    title: "Sales",
    description: "Keep sales activity moving in one workspace.",
  },
  {
    mark: "R",
    title: "Reports",
    description: "Find useful insights for everyday decisions.",
  },
  {
    mark: "U",
    title: "User Management",
    description: "Manage account access and assigned rights.",
  },
];

export default function Home() {
  return (
    <>
      <header className="landing-page landing-topbar">
        <Link
          className="landing-brand"
          href="/"
          aria-label="Hope, Inc. ERP home"
        >
          <span className="landing-brand-mark" aria-hidden="true">
            H
          </span>
          <span>
            <span className="landing-brand-name">HOPE, INC. ERP</span>
            <span className="landing-brand-caption">
              Enterprise Resource Planning
            </span>
          </span>
        </Link>
        <nav className="landing-nav-actions" aria-label="Account">
          <Link className="landing-button landing-button-secondary" href="/login">
            Sign In
          </Link>
          <Link className="landing-button landing-button-primary" href="/register">
            Register
          </Link>
        </nav>
      </header>

      <main className="landing-page">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">HOPE Inc. ERP</p>
            <h1 id="hero-title">Your work, working together.</h1>
            <p>
              Bring your team and daily operations into one clear workspace.
            </p>
            <div className="landing-button-row">
              <Link
                className="landing-button landing-button-primary"
                href="/login"
              >
                Sign In
              </Link>
              <Link
                className="landing-button landing-button-secondary"
                href="/register"
              >
                Register
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-modules" aria-labelledby="modules-title">
          <header className="landing-section-heading">
            <p className="landing-eyebrow">One connected workspace</p>
            <h2 id="modules-title">Everything your team needs</h2>
          </header>
          <div className="landing-module-grid">
            {publicModules.map((module) => (
              <article className="landing-module-card" key={module.title}>
                <span className="landing-module-mark" aria-hidden="true">
                  {module.mark}
                </span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-how-it-works" aria-labelledby="how-title">
          <header className="landing-section-heading">
            <p className="landing-eyebrow">Getting started</p>
            <h2 id="how-title">How it works</h2>
          </header>
          <div className="landing-steps-grid">
            <article className="landing-step-card">
              <span className="landing-step-number" aria-hidden="true">
                1
              </span>
              <h3>Register</h3>
            </article>
            <article className="landing-step-card">
              <span className="landing-step-number" aria-hidden="true">
                2
              </span>
              <h3>Wait for admin approval</h3>
            </article>
            <article className="landing-step-card">
              <span className="landing-step-number" aria-hidden="true">
                3
              </span>
              <h3>Start working with your assigned modules</h3>
            </article>
          </div>
        </section>

        <footer className="landing-footer">HOPE Inc. ERP</footer>
      </main>
    </>
  );
}
