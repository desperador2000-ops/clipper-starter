import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function MePage() {
  const { data: session } = useSession();
  const { data, error, mutate } = useSWR(session ? '/api/me/clips' : null, fetcher, { refreshInterval: 5000 });

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="p-8 rounded-2xl border border-white/10 bg-slate-900/70">Connecte-toi pour voir ton tableau de bord</div>
    </div>
  );

  if (error) return <div className="p-8 text-red-400">Erreur</div>;
  if (!data) return <div className="p-8 text-slate-300">Chargement...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ton tableau de bord</h1>
          <div className="text-sm text-slate-300">{session.user?.email}</div>
        </div>

        <div className="grid gap-4">
          {data.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div>
                <div className="font-semibold">{c.title || c.id}</div>
                <div className="text-sm text-slate-400">Status: {c.status} • Durée: {c.duration ?? '—'}s</div>
              </div>
              <div className="flex gap-2">
                <a href={`/clips/${c.id}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">Voir</a>
                <button onClick={async () => {
                  if (!confirm('Supprimer ce clip ?')) return;
                  const r = await fetch(`/api/clips/${c.id}`, { method: 'DELETE' });
                  if (r.ok) {
                    alert('Supprimé');
                    mutate();
                  } else {
                    const j = await r.json();
                    alert('Erreur: ' + (j.error || 'unknown'));
                  }
                }} className="rounded-full border border-red-500/20 bg-red-600/10 px-3 py-2 text-sm text-red-200">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
