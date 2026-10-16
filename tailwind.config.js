import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function NewClip() {
  const [file, setFile] = useState(null);
  const [source, setSource] = useState(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [status, setStatus] = useState("");
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.9)] backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-violet-300">Clipper</p>
          <h2 className="mt-4 text-3xl font-bold">Connecte-toi pour créer</h2>
          <p className="mt-3 text-sm text-slate-300">Une session est nécessaire pour uploader et découper des moments.</p>
          <button
            onClick={() => signIn()}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  async function uploadSource(e) {
    e.preventDefault();
    if (!file) return;
    setStatus("Téléversement de la source...");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setSource(j);
    setStatus("Source téléversée : " + j.key);
  }

  async function createClip(e) {
    e.preventDefault();
    if (!source) return alert("Téléverse d’abord la source");
    setStatus("Découpe en cours...");
    const r = await fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceKey: source.key, start: Number(start), end: Number(end), title: "Clip rapide", ownerEmail: session.user.email })
    });
    const j = await r.json();
    if (r.ok) {
      setStatus("Clip créé : " + j.clipKey);
    } else {
      setStatus("Erreur : " + j.error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-[30px] border border-white/10 bg-slate-900/65 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.95)] backdrop-blur-sm md:p-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-violet-300">Clipper</p>
            <h1 className="mt-2 text-3xl font-bold md:text-5xl">Créer un clip</h1>
          </div>
          <a href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
            Retour au feed
          </a>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
          <form onSubmit={uploadSource} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <label className="block text-sm font-medium text-slate-300">Source média</label>
            <div className="mt-3 rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/5 p-6 text-center">
              <input type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-violet-500 file:to-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
            </div>
            <button type="submit" className="mt-6 w-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110">
              Uploader la source
            </button>
          </form>

          <form onSubmit={createClip} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300">Titre</label>
                <input
                  value={"Clip rapide"}
                  readOnly
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Début (s)</label>
                  <input
                    type="number"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Fin (s)</label>
                  <input
                    type="number"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {source ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fichier prêt</p>
                    <p className="mt-2 truncate font-medium text-white">{source.key}</p>
                  </div>
                ) : (
                  <p>Le fichier source apparaîtra ici après le téléversement.</p>
                )}
              </div>

              <button type="submit" className="w-full rounded-full border border-violet-400/30 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20">
                Générer le clip
              </button>
            </div>
          </form>
        </div>

        {status && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
