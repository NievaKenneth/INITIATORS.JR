const modules = [
  "User Management",
  "Customers",
  "Products",
  "Human Resources",
  "Sales",
  "Reports",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-hope-ivory">
      <header className="bg-hope-sidebar text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-5">
          <span className="grid size-10 place-items-center rounded-xl bg-hope-gold font-bold text-hope-sidebar">
            H
          </span>
          <div>
            <p className="font-semibold">HOPE Inc.</p>
            <p className="text-sm text-white/70">Enterprise Resource Planning</p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)] md:py-24">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold tracking-wide text-hope-green-2 uppercase">
            Project foundation
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-hope-forest sm:text-5xl">
            Welcome to HOPE Inc. ERP
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-hope-ink/75">
            The application scaffold is ready. ERP features will be added in
            upcoming development tasks.
          </p>
        </div>

        <aside
          aria-labelledby="modules-heading"
          className="rounded-2xl border border-hope-border bg-white p-6 shadow-sm"
        >
          <h2
            id="modules-heading"
            className="text-lg font-semibold text-hope-forest"
          >
            Planned modules
          </h2>
          <ul className="mt-4 divide-y divide-hope-border">
            {modules.map((module) => (
              <li key={module} className="py-3 text-sm text-hope-ink/80">
                {module}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
