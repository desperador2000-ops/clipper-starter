import useSWR from "swr";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Home() {
  const { data, error } = useSWR("/api/clips", fetcher);
  const { data: session } = useSession();

  if (error) return <div>Erreur</div>;
  if (!data) return <div>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Feed Clips</h1>
        <div>
          {session ? (
            <>
              <span style={{ marginRight: 10 }}>Bonjour {session.user?.email || session.user?.name}</span>
              <button onClick={() => signOut()}>Se déconnecter</button>
            </>
          ) : (
            <button onClick={() => signIn()}>Se connecter</button>
          )}
        </div>
      </header>

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
