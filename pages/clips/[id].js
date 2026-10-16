import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function ClipPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const { data, error, mutate } = useSWR(id ? `/api/clips/${id}` : null, fetcher, { refreshInterval: 2000 });
  const [sseConnected, setSseConnected] = useState(false);
  const eventRef = useRef(null);
  const waveRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    const ev = new EventSource('/api/stream');
    eventRef.current = ev;
    ev.onopen = () => setSseConnected(true);
    ev.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.id === id) {
          mutate();
        }
      } catch (err) {
        // ignore
      }
    };
    ev.onerror = () => {
      setSseConnected(false);
      ev.close();
    };
    return () => ev.close();
  }, [id]);

  useEffect(() => {
    // lazy load WaveSurfer only when we have an audio url
    if (!data || !data.url) return;
    const isAudio = data.clipKey && (data.clipKey.endsWith('.mp3') || data.clipKey.endsWith('.wav') || data.clipKey.endsWith('.ogg'));
    if (!isAudio) return;

    let WaveSurfer = null;
    (async () => {
      WaveSurfer = (await import('wavesurfer.js')).default;
      const ws = WaveSurfer.create({ container: '#waveform', waveColor: '#8b5cf6', progressColor: '#06b6d4', height: 80 });
      ws.load(data.url);
      waveRef.current = ws;
    })();

    return () => {
      try { waveRef.current && waveRef.current.destroy(); } catch (e) {}
    };
  }, [data]);

  if (error) return <div className="p-8 text-red-400">Erreur</div>;
  if (!data) return <div className="p-8 text-slate-300">Chargement...</div>;

  const isOwner = session && session.user && data.ownerId && (session.user.email === data.owner?.email || true);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{data.title || 'Clip'}</h1>
          <div className="text-sm text-slate-300">Status: <span className="font-medium">{data.status}</span></div>
        </div>

        {data.status !== 'done' && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Ce clip est en cours de traitement ou indisponible. Rafraîchissement automatique activé. (SSE: {sseConnected ? 'on' : 'off'})
          </div>
        )}

        {data.url ? (
          <div className="mb-6">
            <video controls src={data.url} className="w-full rounded-2xl bg-black" />
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">Aucun clip disponible pour le moment.</div>
        )}

        <div id="waveform" className="mb-6" />

        <div className="mt-6 flex gap-3">
          {isOwner && (
            <button
              onClick={async () => {
                if (!confirm('Supprimer ce clip ?')) return;
                const r = await fetch(`/api/clips/${id}`, { method: 'DELETE' });
                if (r.ok) {
                  alert('Supprimé');
                  router.push('/me');
                } else {
                  const j = await r.json();
                  alert('Erreur: ' + (j.error || 'unknown'));
                }
              }}
              className="rounded-full border border-red-400/20 bg-red-600/10 px-4 py-2 text-sm text-red-200"
            >
              Supprimer
            </button>
          )}

          <button onClick={() => mutate()} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">Rafraîchir</button>
        </div>
      </div>
    </div>
  );
}
