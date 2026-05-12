# İsim Şehir

Klasik Türk kelime oyununun çok oyunculu, peer-to-peer WebRTC tabanlı versiyonu.

**Oyna:** [isim-sehir.vercel.app](https://isim-sehir.vercel.app)

## Stack

React 19 + TypeScript 5 + Vite 6 + MUI 6 + Zustand 5 + PeerJS + React Router 7

## Mimari

- **Frontend:** Vercel'e deploy edilmiş React SPA
- **Signaling Server:** Render'da özel PeerJS sunucusu
- **Multiplayer:** WebRTC mesh topolojisi (PeerJS)

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run lint       # type check
```

Signaling server için:
```bash
cd server && npm install && npm start   # http://localhost:9000
```

## Ortam Değişkenleri

Vercel'de tanımlıdır:

| Değişken | Örnek |
|---|---|
| `VITE_PEER_HOST` | `isim-sehir-server.onrender.com` |
| `VITE_PEER_PORT` | `443` |
| `VITE_PEER_PATH` | `/isim-sehir` |

Detaylı spesifikasyon: [SPEC.md](./SPEC.md)
