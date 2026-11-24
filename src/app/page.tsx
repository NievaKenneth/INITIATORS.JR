// TEMPORARY: replaced by the UIX-04 landing page in DEV-08.
import Link from "next/link";

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

      <section className="mx-auto flex min-h-[calc(100vh-84px)] max-w-7xl items-center px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-hope-forest sm:text-5xl">
            Welcome to HOPE Inc. ERP
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-hope-ink/75">
            Sign in to continue or register to request access to your ERP
            workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
              href="/login"
            >
              Sign In
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-hope-border bg-white px-4 text-sm font-semibold text-hope-forest transition-colors hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
              href="/register"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
