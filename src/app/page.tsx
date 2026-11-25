import Link from "next/link";

const landingModules = [
  {
    glyph: "C",
    name: "Customers",
    description: "Keep customer information organized in one place.",
  },
  {
    glyph: "P",
    name: "Products",
    description: "Manage products and pricing with clarity.",
  },
  {
    glyph: "HR",
    name: "Human Resources",
    description: "Support your people and their work.",
  },
  {
    glyph: "S",
    name: "Sales",
    description: "Keep sales activity moving in one workspace.",
  },
  {
    glyph: "R",
    name: "Reports",
    description: "Find useful insights for everyday decisions.",
  },
  {
    glyph: "U",
    name: "User Management",
    description: "Manage account access and assigned rights.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-hope-ivory font-[Inter,_Segoe_UI,_Arial,sans-serif] text-hope-ink">
      <header className="mx-auto flex min-h-[72px] w-[calc(100%-32px)] max-w-[1120px] flex-wrap items-center justify-between gap-3 border-b border-hope-border bg-white px-4 sm:w-[calc(100%-48px)] sm:px-0">
        <Link
          className="flex items-center gap-3 text-hope-ink no-underline"
          href="/"
          aria-label="Hope, Inc. ERP home"
        >
          <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-hope-gold text-[15px] font-bold text-hope-sidebar">
            H
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.12em]">
              HOPE, INC. ERP
            </span>
            <span className="mt-1 block text-xs text-hope-ink">
              Enterprise Resource Planning
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2.5" aria-label="Account">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-hope-border bg-white px-4 text-[13px] font-semibold text-hope-forest transition-colors hover:border-hope-green-2 hover:bg-hope-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
            href="/login"
          >
            Sign In
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-[6px] bg-hope-forest px-4 text-[13px] font-semibold text-white transition-colors hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
            href="/register"
          >
            Register
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-[calc(100%-32px)] max-w-[1120px] sm:w-[calc(100%-48px)]">
        <section
          className="mt-6 rounded-2xl bg-hope-forest px-6 py-8 text-white sm:px-10 sm:py-12 lg:px-[52px] lg:py-[52px]"
          aria-labelledby="hero-title"
        >
          <div className="max-w-2xl">
            <p className="mb-2.5 text-xs font-bold tracking-[0.1em] text-hope-gold uppercase">
              HOPE Inc. ERP
            </p>
            <h1
              className="max-w-[700px] text-[28px] leading-tight font-bold text-white sm:text-[32px]"
              id="hero-title"
            >
              Your work, working together.
            </h1>
            <p className="mt-3.5 max-w-[590px] text-sm leading-6 text-hope-sage sm:text-base">
              Bring your team and daily operations into one clear workspace.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[6px] bg-hope-gold px-4 text-[13px] font-semibold text-hope-sidebar transition-colors hover:bg-hope-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                href="/login"
              >
                Sign In
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-white/40 bg-transparent px-4 text-[13px] font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                href="/register"
              >
                Register
              </Link>
            </div>
          </div>
        </section>

        <section
          className="pb-3 pt-9 sm:pt-12"
          aria-labelledby="modules-title"
        >
          <header className="mb-[18px]">
            <p className="mb-2.5 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              One connected workspace
            </p>
            <h2
              className="text-2xl leading-[1.3] font-semibold text-hope-forest"
              id="modules-title"
            >
              Everything your team needs
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landingModules.map((module) => (
              <article
                className="min-h-[156px] rounded-[10px] border border-hope-border bg-white p-4 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-5"
                key={module.name}
              >
                <span
                  className="mb-3.5 grid size-9 place-items-center rounded-[6px] bg-hope-sage text-xs font-bold text-hope-forest"
                  aria-hidden="true"
                >
                  {module.glyph}
                </span>
                <h3 className="text-lg leading-[1.4] font-semibold text-hope-forest">
                  {module.name}
                </h3>
                <p className="mt-1.5 text-xs leading-[1.45] text-hope-ink">
                  {module.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-9 sm:py-11" aria-labelledby="how-title">
          <header className="mb-[18px]">
            <p className="mb-2.5 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Getting started
            </p>
            <h2
              className="text-2xl leading-[1.3] font-semibold text-hope-forest"
              id="how-title"
            >
              How it works
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              "Register",
              "Wait for admin approval",
              "Start working with your assigned modules",
            ].map((step, index) => (
              <article
                className="flex min-w-0 items-center gap-3.5 rounded-[10px] border border-hope-border bg-white p-[15px] sm:p-[18px]"
                key={step}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-hope-gold text-[13px] font-bold text-hope-sidebar"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-hope-forest">
                  {step}
                </h3>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-hope-border py-5 text-xs text-hope-ink">
          HOPE Inc. ERP
        </footer>
      </main>
    </div>
  );
}
