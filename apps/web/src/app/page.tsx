export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="text-xl font-bold tracking-tight">
          Utility<span className="text-indigo-400">X</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#features"
            className="hidden text-sm text-zinc-400 transition hover:text-white sm:block"
          >
            Features
          </a>

          <a
            href="/login"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Dashboard
          </a>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[75vh] w-full max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
          Discord management, simplified.
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Everything your Discord
          <span className="block text-indigo-400">server needs.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Manage moderation, tickets, logging, welcome systems, automation,
          server settings, and more from one powerful dashboard.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="/login"
            className="rounded-xl bg-indigo-500 px-6 py-3 font-semibold transition hover:bg-indigo-400"
          >
            Open Dashboard
          </a>

          <a
            href="#features"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Explore Features
          </a>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto grid w-full max-w-7xl gap-4 px-6 pb-24 md:grid-cols-3"
      >
        {[
          ["Moderation", "Powerful tools to help your staff manage your community."],
          ["Tickets", "Create organized support systems directly inside Discord."],
          ["Logging", "Keep track of important server activity and moderation events."],
          ["Welcome Systems", "Customize welcome messages, goodbye messages, and roles."],
          ["Automation", "Reduce repetitive work with configurable server automation."],
          ["Web Dashboard", "Configure UtilityX without digging through endless commands."],
        ].map(([title, description]) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 leading-7 text-zinc-400">{description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
