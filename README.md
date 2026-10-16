# Clipper - starter

MVP Clipping (Next.js + Prisma + ffmpeg + S3/MinIO)

Prereqs:
- Docker & Docker Compose
- Node 18+
- (option) ffmpeg system-wide; ffmpeg-static is included but having ffmpeg helps.

1) Démarrer infra dev (Postgres + MinIO)

docker-compose up -d

2) Copier `.env.example` en `.env` et remplir les valeurs (voir MinIO credentials dans docker-compose)

3) Installer

npm install

4) Initialiser la DB (Prisma)

npx prisma generate
npx prisma migrate dev --name init

5) Lancer en dev

npm run dev

Endpoints principaux:
- POST /api/upload -> upload multipart => renvoie { key, url }
- POST /api/clips -> { sourceKey, start, end, title } -> découpe via ffmpeg -> renvoie clip DB object

Notes:
- Pour la production, configure un bucket S3 réel et secrets (ne pas utiliser MinIO en prod).
- ffmpeg est utilisé via ffmpeg-static; si tu veux isolation, tu peux exécuter le service ffmpeg dans un conteneur.
