import useSWR from "swr";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const fetcher = (url) => fetch(url).then(r => r.json());

function ClipCard({ clip }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-[var(--shadow)] overflow-hidden backdrop-blur-sm">
      <div className="relative h-56 bg-gradient-to-br from-violet-500/30 via-sky-500/20 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute left-4 top-4 rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200">
          clip
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-300 uppercase tracking-[0.18em]">{clip.duration}s</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{clip.title || "Clip"}</h3>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL}/api/proxy?key=${encodeURIComponent(clip.clipKey)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
          >
            Voir
          </a>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-300">
        <span>#{clip.id.slice(0, 8)}</span>
        <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
      </div>
    </article>
  );
}

export default function Home() {
  const { data, error } = useSWR("/api/clips", fetcher);
  const { data: session } = useSession();

  if (error) return <div className="p-8 text-red-400">Erreur de chargement</div>;
  if (!data) return <div className="p-8 text-slate-300">Chargement des clips...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 font-black text-lg shadow-lg shadow-violet-900/40">
            C
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Clipper</p>
            <h2 className="text-lg font-semibold">Studio</h2>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#feed" className="hover:text-white">Feed</a>
          <a href="#creator" className="hover:text-white">Créer</a>
          <a href="#about" className="hover:text-white">À propos</a>
        </nav>

        <div>
          {session ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-300 md:inline">{session.user?.email || session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110"
            >
              Se connecter
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16">
        <section className="grid items-center gap-8 py-8 md:grid-cols-[1.2fr_0.8fr] md:py-16">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-200">
              Nouveau
            </p>
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Coupe, partage et diffuse tes meilleurs moments.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Un espace pour transformer des vidéos longues en clips percutants, les organiser, et les partager en un clic.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/clips/new"
                className="rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110"
              >
                Créer un clip
              </a>
              <button
                onClick={() => signIn()}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Explorer le feed
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
              <div>
                <span className="block text-2xl font-bold text-white">{data.length || 0}</span>
                clips live
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">24/7</span>
                accès
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">HD</span>
                exports
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.85),rgba(17,24,39,0.9))] p-5 shadow-[var(--shadow)]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Aujourd’hui</p>
                  <h3 className="mt-1 text-2xl font-bold text-white">Live session</h3>
                </div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  En ligne
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="flex h-64 items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.35),rgba(15,23,42,0.9))]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-300/40 bg-white/10 text-2xl shadow-lg shadow-violet-900/30">
                    ▶
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Durée</span>
                  <span className="font-medium text-white">00:42</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Engagement</span>
                  <span className="font-medium text-white">+28%</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Partages</span>
                  <span className="font-medium text-white">128</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="feed" className="py-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Feed</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Derniers clips</h2>
            </div>
            <a href="/clips/new" className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 md:inline-flex">
              Ajouter un clip
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
