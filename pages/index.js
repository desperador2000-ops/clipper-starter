import useSWR from "swr";
import React from "react";

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Home() {
  const { data, error } = useSWR("/api/clips", fetcher);
  if (error) return <div>Erreur</div>;
  if (!data) return <div>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Feed Clips</h1>
      <a href="/clips/new">Créer un clip</a>
      <ul>
        {data.map(c => (
          <li key={c.id}>
            <strong>{c.title || c.id}</strong> — <a href={`${process.env.NEXT_PUBLIC_APP_URL}/api/proxy?key=${encodeURIComponent(c.clipKey)}`} target="_blank" rel="noreferrer">Voir</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
