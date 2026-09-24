export function NoActiveEvent() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 max-w-lg text-center space-y-4">
        <div className="text-6xl">🎮</div>
        <h1 className="font-display text-2xl font-bold">LaserGame FaceClub</h1>
        <p className="text-xl font-semibold text-accent">Nedá sa prihlásiť</p>
        <p className="text-white/70">
          Momentálne nemáme naplánovaný žiadny LaserGame event. Ďakujeme za pochopenie.
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-3 rounded-xl bg-panel2 border border-white/10 font-display font-bold hover:bg-panel2/80 transition"
        >
          SPÄŤ NA ÚVOD
        </a>
      </div>
    </main>
  );
}
