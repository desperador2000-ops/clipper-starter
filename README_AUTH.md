# Authentication / NextAuth

J'ai ajouté NextAuth pour l'authentification avec :
- Provider Email (lien magique) — configure EMAIL_SERVER et EMAIL_FROM
- Provider GitHub (optionnel) — configure GITHUB_ID et GITHUB_SECRET

Nouvelles variables d'environnement à ajouter dans `.env` (voir `.env.example`):

- NEXTAUTH_URL=http://localhost:3000
- EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
- EMAIL_FROM="Clipper <no-reply@example.com>"
- GITHUB_ID=your_github_oauth_client_id
- GITHUB_SECRET=your_github_oauth_client_secret

Notes pour la migration Prisma

Après avoir mis à jour `.env`, exécute :

npm install
npx prisma generate
npx prisma migrate dev --name add_nextauth

Cela créera les tables nécessaires pour NextAuth (accounts, sessions, verification tokens).
