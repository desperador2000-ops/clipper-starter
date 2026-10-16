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
      <div style={{ padding: 20 }}>
        <h2>Connecte-toi pour créer des clips</h2>
        <button onClick={() => signIn()}>Se connecter</button>
      </div>
    )
  }

  async function uploadSource(e) {
    e.preventDefault();
    if (!file) return;
    setStatus("Uploading source...");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setSource(j);
    setStatus("Uploaded: " + j.key);
  }

  async function createClip(e) {
    e.preventDefault();
    if (!source) return alert("Upload a source first");
    setStatus("Processing clip...");
    const r = await fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceKey: source.key, start: Number(start), end: Number(end), title: "Clip rapide", ownerEmail: session.user.email })
    });
    const j = await r.json();
    if (r.ok) {
      setStatus("Clip created: " + j.clipKey);
    } else {
      setStatus("Error: " + j.error);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Créer un clip</h1>
      <form onSubmit={uploadSource}>
        <input type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Uploader la source</button>
      </form>

      {source && (
        <form onSubmit={createClip}>
          <p>Source: {source.key}</p>
          <label>Start (s): <input type="number" value={start} onChange={(e)=>setStart(e.target.value)} /></label>
          <label>End (s): <input type="number" value={end} onChange={(e)=>setEnd(e.target.value)} /></label>
          <button type="submit">Créer le clip</button>
        </form>
      )}

      <p>{status}</p>
    </div>
  );
}
