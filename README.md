# Clipper - starter

MVP Clipping (Next.js + Prisma + ffmpeg + S3/MinIO)

Prereqs:
- Docker & Docker Compose
- Node 18+
- ffmpeg-static included; having ffmpeg system-wide can help.

1) Démarrer infra dev (Postgres + MinIO + Redis)

docker-compose up -d

2) Créer un bucket MinIO nommé `clipper` via l’interface MinIO http://localhost:9000/

3) Copier `.env.example` en `.env` et remplir les valeurs

4) Installer

npm install

5) Initialiser la DB (Prisma)

npx prisma generate
npx prisma migrate dev --name init

6) Démarrer le worker (traitement ffmpeg asynchrone)

npm run worker

7) Démarrer l’app en dev

npm run dev

8) Ouvrir l'app : http://localhost:3000

Important auth:
- Ajoutez les variables suivantes dans le `.env` si vous utilisez NextAuth :
  - NEXTAUTH_URL=http://localhost:3000
  - EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
  - EMAIL_FROM="Clipper <no-reply@example.com>"
  - GITHUB_ID=...
  - GITHUB_SECRET=...

Queue & worker:
- Redis est utilisé pour la queue (BullMQ). Le worker (worker/worker.js) traite les jobs et met à jour la base.
- Lors de la création d'un clip via /api/clips, un enregistrement Clip est créé en base avec status='queued' et un job est ajouté.
- Le worker télécharge la source depuis S3, exécute ffmpeg pour la découpe, upload le clip final, puis met à jour le record Clip (clipKey, status='done').

Sécurité ajoutée (étape 1):
- `/api/upload` exige une session active
- `/api/clips` exige une session active
- les uploads sont limités à 300MB et aux types video/* et audio/*
- l’utilisateur connecté est associé au clip via `ownerId`

Notes:
- Pour la production, configure un bucket S3 réel et des secrets dans l’environnement.
- Le worker doit être lancé (npm run worker) pour traiter les jobs en file d'attente.
