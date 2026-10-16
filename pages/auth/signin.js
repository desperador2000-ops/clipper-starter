import { getProviders, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function SignIn() {
  const [providers, setProviders] = useState(null)
  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Se connecter</h1>
      {providers && Object.values(providers).map((p) => (
        <div key={p.name} style={{ margin: 10 }}>
          <button onClick={() => signIn(p.id)}>{p.name}</button>
        </div>
      ))}
      <p>Si vous utilisez l'email, un lien magique sera envoyé à votre adresse (configurer EMAIL_SERVER).</p>
    </div>
  )
}
