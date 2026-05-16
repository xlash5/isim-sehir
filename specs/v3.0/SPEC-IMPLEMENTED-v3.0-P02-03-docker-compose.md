# İsim Şehir — v3.0 Docker Compose for Local Development

> **Priority:** P02 — lowers onboarding friction, enables consistent dev environment
> **Version target:** v3.0
> **Status:** ✅ Implemented

## Overview

Starting the project locally requires two terminals: one for the Vite frontend dev server, one for the PeerJS signalling server. New contributors must also have Node.js installed at the correct version. This spec adds a `docker-compose.yml` that spins up both services with a single command, plus a production-like build for the frontend.

## Requirements

### 1. Single-Command Start

```bash
docker compose up
```

This starts:
- **Frontend** (`:5173`) — Vite dev server with hot reload
- **Signalling server** (`:9000`) — PeerJS server

Both services restart automatically if they crash. Logs are streamed to the terminal with colour-coded prefixes.

### 2. Production-Like Build (optional)

A separate `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` that:
- Builds the frontend with `npm run build`
- Serves it via Nginx or Caddy (static file server)
- Runs the signalling server as before

This is useful for testing the production build locally before deploying.

### 3. Developer Experience

- Bind mounts for frontend source → hot reload works inside the container
- `.dockerignore` excludes `node_modules/`, `dist/`, `.git/` for fast builds
- Environment variables configurable via `.env` file (or a `docker-compose.override.yml`)
- Graceful shutdown on `Ctrl+C`
- Consistent Node.js version (20 LTS)

## Technical Design

### Dockerfile (Frontend)

```dockerfile
# Dockerfile
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM dev AS build
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Dockerfile (Server)

```dockerfile
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 9000
CMD ["node", "index.js"]
```

### docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: .
      target: dev
    ports:
      - "5173:5173"
    volumes:
      - ./src:/app/src
      - ./index.html:/app/index.html
      - ./vite.config.ts:/app/vite.config.ts
      - ./tsconfig.json:/app/tsconfig.json
    environment:
      - VITE_PEER_HOST=localhost
      - VITE_PEER_PORT=9000
      - VITE_PEER_PATH=/isim-sehir

  signalling:
    build: ./server
    ports:
      - "9000:9000"
    environment:
      - PORT=9000
      - MAX_PEERS_PER_ROOM=8
      - MAX_CONNECTIONS_PER_SEC=5
      - CONNECTION_TIMEOUT_MS=30000
      - ROOM_TTL_MINUTES=5
      - ALLOWED_ORIGINS=http://localhost:5173
```

### nginx.conf (prod mode)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### .dockerignore

```
node_modules/
dist/
.git/
*.md
*.local
.vite/
```

### Environment Variables

| Variable | Default (dev) | Notes |
|---|---|---|
| `VITE_PEER_HOST` | `localhost` | Override for production-like setups |
| `VITE_PEER_PORT` | `9000` | |
| `VITE_PEER_PATH` | `/isim-sehir` | |
| `PORT` (server) | `9000` | |

## Files to Create

- `Dockerfile` (frontend, multi-stage)
- `server/Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

## Files to Modify

- (none — no source changes needed)

## Acceptance Criteria

- [ ] `docker compose up` starts both services
- [ ] Frontend accessible at `http://localhost:5173` with hot reload
- [ ] Signalling server accessible at `ws://localhost:9000/isim-sehir`
- [ ] Full game works (create room → join room → play round) with two browser tabs
- [ ] `Ctrl+C` stops both services cleanly
- [ ] `docker compose build` completes in <2 minutes (cached layers)
