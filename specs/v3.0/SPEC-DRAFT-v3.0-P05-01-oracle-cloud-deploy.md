# İsim Şehir — v3.0 Oracle Cloud Free Tier Full-Stack Deployment

> **Priority:** P05 — consolidates frontend + signalling server on a single free VM  
> **Version target:** v3.0  
> **Status:** 🔵 Draft  

## Overview

Currently the app deploys across two providers: Vercel (frontend) and Render (signalling server).  
This spec migrates everything to a single **Oracle Cloud ARM free-tier VM** running Docker Compose, eliminating both monthly costs and provider coupling.

The existing Vercel + Render setup remains the primary deploy path — this is an **alternative self-hosted option** for a free, unified deployment.

## Requirements

### 1. Single-VM Docker Deploy

`docker compose up` on the Oracle box runs:
- **Frontend** — Nginx serving the production build (`docker-compose.prod.yml` target `prod`)
- **Signalling server** — PeerJS on `:9000`

### 2. Automated Deploy via GitHub Actions

A new workflow (`.github/workflows/deploy-oracle.yml`) that:
- Triggers on push to `master` (or manually via `workflow_dispatch`)
- Builds the frontend image on the VM (or pulls from GHCR)
- `docker compose up -d` with zero-downtime restart
- SSH into the Oracle VM — key-based auth, no plaintext passwords

### 3. HTTPS + Domain (Optional but Recommended)

- Caddy as a reverse proxy on the VM (auto-Let's Encrypt) — or keep direct IP for testing
- Subdomain `game.yourdomain.com` → Nginx frontend `:80`
- WebSocket path `/isim-sehir` → signalling server `:9000` (proxied)

### 4. No Data Loss on Redeploy

- Signalling server state is in-memory (no volume mounts needed)
- Game history lives in players' browsers (localStorage) — no server-side state to persist

### 5. Minimal Maintenance

- Weekly Docker image prune via cron
- Automatic restart on VM reboot (`restart: unless-stopped`)
- Single `.env` file for all secrets and configuration

## Technical Design

### VM Provisioning

| Resource | Oracle Free Tier Limit | This App Need |
|---|---|---|
| Architecture | ARM Ampere A1 | ARM (compatible) |
| vCPUs | Up to 4 | 1 (burst to 2) |
| RAM | Up to 24 GB | 512 MB is plenty |
| Storage | Up to 200 GB | 10 GB |
| Bandwidth | 10 TB/month | Negligible |

### Directory Layout on VM

```
/home/ubuntu/isim-sehir/
├── docker-compose.yml       # prod compose file
├── .env                     # environment variables
├── Caddyfile                # (optional) TLS reverse proxy
└── data/                    # (empty — future persistence)
```

### docker-compose.prod.yml (reuse existing)

The existing `docker-compose.prod.yml` already has the right setup. On the VM, a thin `docker-compose.yml` wraps it with the `.env` file:

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: prod
    ports:
      - "127.0.0.1:80:80"
    env_file: .env
    restart: unless-stopped

  signalling:
    build: ./server
    ports:
      - "127.0.0.1:9000:9000"
    env_file: .env
    restart: unless-stopped
```

> If using Caddy: frontend binds to `127.0.0.1:80`, Caddy binds `:443` and proxies to it.  
> Without Caddy: frontend binds `0.0.0.0:80`, signalling binds `0.0.0.0:9000`.

### Caddyfile (optional)

```
game.yourdomain.com {
    reverse_proxy localhost:80
}

ws.game.yourdomain.com {
    reverse_proxy localhost:9000
}
```

### GitHub Actions Workflow

```yaml
name: Deploy to Oracle Cloud

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.ORACLE_HOST }}
          username: ubuntu
          key: ${{ secrets.ORACLE_SSH_KEY }}
          script: |
            cd /home/ubuntu/isim-sehir
            git pull origin master
            docker compose -f docker-compose.prod.yml up -d --build
            docker image prune -f
```

### Environment Variables

| Variable | Dev Default | Oracle VM | Notes |
|---|---|---|---|
| `VITE_PEER_HOST` | `localhost` | `game.yourdomain.com` or VM IP | Frontend connects to this |
| `VITE_PEER_PORT` | `9000` | `443` (Caddy) or `9000` | |
| `VITE_PEER_PATH` | `/isim-sehir` | `/isim-sehir` | |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | `https://game.yourdomain.com` or `http://<VM_IP>` | CORS for signalling server |

## Files to Create

- `.github/workflows/deploy-oracle.yml`
- `deploy/` directory (optional — for VM setup script, Caddyfile, etc.)

## Files to Modify

- `docker-compose.prod.yml` — add `restart: unless-stopped` to services
- `README.md` — add Oracle Cloud deploy option to docs

## Acceptance Criteria

- [ ] Oracle VM provisioned with Ubuntu 22.04 LTS (ARM)
- [ ] Docker + Docker Compose installed on VM
- [ ] `docker compose up -d` starts both services
- [ ] Frontend accessible at `http://<VM_IP>` — game works in two browser tabs
- [ ] WebSocket connection to signalling server succeeds
- [ ] `git push master` triggers GitHub Actions deploy (or manual dispatch)
- [ ] Redeploy does not drop active games (stateless)
- [ ] VM restart restarts containers automatically
- [ ] (Optional) HTTPS via Caddy with auto-Let's Encrypt
