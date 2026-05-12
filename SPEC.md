# İsim Şehir — Oyun Spesifikasyonu

## 1. Proje Özeti

**İsim Şehir**, klasik Türk kelime oyununun modern, çok oyunculu, peer-to-peer WebRTC tabanlı bir versiyonudur. Oyuncular oda oluşturup arkadaşlarını davet eder, seçtikleri kategorilerde ve belirlenen harfte kelimeler yazarak birbirlerine puan verir.

- **Platform:** Web (React SPA)
- **Multiplayer:** Peer-to-peer (WebRTC) via PeerJS
- **UI Kütüphanesi:** Material UI (MUI) v6
- **State Management:** Zustand v5
- **Routing:** React Router v7
- **Dil:** Tamamen Türkçe
- **Kimlik:** Anonim / rumuz bazlı

## 2. Mimari

### 2.1 Deployment

| Bileşen | Platform | URL |
|---|---|---|
| Frontend (SPA) | Vercel | `https://isim-sehir.vercel.app` |
| PeerJS Signaling Server | Render (dashboard.render.com) | `https://isim-sehir-server.onrender.com` |

### 2.2 Ortam Değişkenleri (Vercel)

| Değişken | Değer | Açıklama |
|---|---|---|
| `VITE_PEER_HOST` | `isim-sehir-server.onrender.com` | PeerJS signaling sunucu host |
| `VITE_PEER_PORT` | `443` | PeerJS signaling sunucu port |
| `VITE_PEER_PATH` | `/isim-sehir` | PeerJS signaling sunucu path |

### 2.3 PeerJS Signaling Server (`server/`)

Özel PeerJS sunucusu `peer` npm paketi ile çalışır:

```js
PeerServer({ port: PORT, path: '/isim-sehir', allow_discovery: true })
```

- Render'a deploy edilmiştir (Web Service)
- Production: `443` port, `wss://` (WebSocket Secure)
- Frontend `.env` ile bu sunucuya yönlendirilir

### 2.4 Klasör Yapısı (Mevcut)

```
isim-sehir/
├── server/
│   ├── index.js          # PeerJS signaling server
│   └── package.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ChatBox.tsx
│   │   │   ├── CopyCode.tsx
│   │   │   ├── PlayerAvatar.tsx
│   │   │   └── Timer.tsx
│   │   ├── Game/
│   │   │   ├── SlotMachine.tsx
│   │   │   ├── AnswerTable.tsx
│   │   │   ├── GradingPanel.tsx
│   │   │   └── Scoreboard.tsx
│   │   └── Lobby/
│   │       ├── GameSettingsPanel.tsx
│   │       └── PlayerList.tsx
│   ├── context/
│   │   └── PeerContext.tsx
│   ├── hooks/
│   │   └── useGame.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── stores/
│   │   ├── useGameStore.ts
│   │   └── usePeerStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── categories.ts
│   │   ├── letters.ts
│   │   └── scoring.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme.ts
│   └── vite-env.d.ts
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── SPEC.md
└── README.md
```

## 3. Oyun Akışı

### 3.1 Giriş Ekranı (`/`)
- Rumuz girilir (max 20 karakter, boş olamaz)
- "Oda Oluştur" → Peer oluşturur, `/room/:roomId`'ye yönlendirir
- "Odaya Katıl" → 6 haneli kod girilir, `/room/:roomId`'ye yönlendirir

### 3.2 Lobi (`/room/:roomId`)
- Oyuncu listesi + hazır durumu
- Admin için ayar paneli (kategoriler, tur sayısı, süre, harf havuzu)
- Oda kodu gösterimi + kopyalama
- Sohbet kutusu
- "Hazır" butonu (admin için "Oyuna Başla")
- Admin hazırken ayarlar devre dışı kalır

### 3.3 Harf Çarkı
- SlotMachine bileşeni ile rastgele harf seçimi (animasyonlu)
- 28 harf (A-Z, Ğ hariç, İ dahil)
- Admin `round-start` mesajı ile broadcast eder

### 3.4 Cevap Aşaması
- Seçilen kategoriler için input alanları
- Zamanlayıcı (admin ayarına göre)
- "Cevapları Gönder" ile erken teslim
- Süre bitince otomatik gönderim
- Tüm oyuncular gönderince → grading aşamasına geçer

### 3.5 Değerlendirme (Peer Grading)
- Tüm cevaplar kategorilere göre gruplanır, tek sayfada gösterilir
- Her cevap için diğer oyuncular 👍 Geçerli / 👎 Geçersiz oylar
- Oylanan oyuncular ve oyları (✅/❌) herkes tarafından görülür
- Tüm oylar tamamlanınca admin "Sonuçları Göster" butonuna basar
- Admin dışındaki oyuncular sonucu bekler

### 3.6 Tur Sonuçları
- Her tur sonunda puan durumu gösterilir
- Kümülatif toplam puan + bu tur kazanılan puan gösterilir
- Sadece admin "Sonraki Tur" butonuna basabilir

### 3.7 Oyun Sonu
- Tüm turlar bittiğinde `game-over` fazına geçilir
- Nihai sıralama gösterilir (🥇🥈🥉)
- "Tekrar Oyna" ve "Lobiye Dön" butonları

## 4. Puan Sistemi

| Durum | Puan |
|---|---|
| Geçerli ve benzersiz cevap | 10 |
| Geçerli ama başkasıyla aynı cevap | 5 |
| Geçersiz / oylanarak reddedilmiş | 0 |
| Boş bırakılmış | 0 |

Aynı cevap kontrolü `normalizeAnswer()` ile yapılır (tr-TR lowercasing, non-alphanumeric strip).

## 5. Peer-to-Peer (WebRTC)

- **Kütüphane:** PeerJS (`peerjs` npm)
- **Topoloji:** Mesh (6-8 oyuncuya kadar ideal)
- **Signaling:** Özel PeerJS sunucusu (`server/index.js`)

### Mesaj Tipleri

| Mesaj | Açıklama | Gönderen |
|---|---|---|
| `join-room` | Oyuncu odaya katıldı | Katılan |
| `room-state-sync` | Tam oda durumu senkronizasyonu | Admin |
| `player-ready` | Oyuncu hazır | Herkes |
| `settings-update` | Oyun ayarları güncellendi | Admin |
| `game-start` | Oyun başladı | Admin |
| `round-start` | Yeni tur, harf seçildi | Admin |
| `answers-submit` | Cevaplar gönderildi | Herkes |
| `vote` | Oyuncu oylaması | Herkes |
| `round-end` | Tur sonuçları | Admin |
| `chat-message` | Sohbet mesajı | Herkes |
| `player-disconnected` | Oyuncu ayrıldı | Sistem |

## 6. Veri Yapıları

```ts
type GamePhase = 'lobby' | 'wheel' | 'answering' | 'grading' | 'round-results' | 'game-over'

interface Player { id: string; nickname: string; isAdmin: boolean; isReady: boolean; score: number }

interface GameSettings {
  categories: string[]       // seçilen kategori isimleri (2-10)
  totalRounds: number        // 1-15
  roundDuration: number|null // saniye, null=limitsiz
  letterPool: string[]       // seçilen harfler (Ğ hariç)
}

interface GameRoom {
  code: string; adminId: string; players: Player[]
  settings: GameSettings; phase: GamePhase
  currentRound: number; currentLetter: string|null
  pendingLetter: string|null; rounds: Round[]
}

interface Round { letter: string; answers: Answer[]; votes: Vote[] }

interface Answer { playerId: string; category: string; value: string }

interface Vote { voterId: string; answerId: string; isValid: boolean }

interface ChatMessage { playerId: string; nickname: string; text: string; timestamp: number }

interface GradingItem {
  playerId: string; nickname: string
  answers: { category: string; value: string; answerId: string }[]
}
```

## 7. Kategori Listesi (32)

1. İsim (Erkek)
2. İsim (Kadın)
3. Şehir (Türkiye)
4. Ülke (Dünya)
5. Başkent
6. Hayvan
7. Bitki / Çiçek
8. Meyve / Sebze
9. Eşya
10. Marka
11. Araba Markası
12. Teknoloji Markası
13. Ünlü (Sanatçı / Oyuncu)
14. Şarkıcı / Müzik Grubu
15. Film
16. Dizi
17. Çizgi Film / Animasyon Karakteri
18. Kitap
19. Yazar
20. Meslek
21. Spor Dalı
22. Futbol Takımı
23. Futbolcu
24. Yemek / Tatlı
25. İçecek
26. Renk
27. Giysi / Aksesuar
28. Müzik Aleti
29. Bilim İnsanı / Mucit
30. Dağ / Nehir / Göl
31. Mitolojik Karakter
32. Peri Bacaları / Turistik Yer

## 8. Kurallar ve Kısıtlamalar

- **Ğ** harfi asla seçilmez
- Oyuncu sayısı: min 2, max 8
- Aynı odada aynı rumuz kullanılamaz
- Cevap gönderildikten sonra geri alınamaz
- Oylama değiştirilemez (bir kere verilen oy geri alınamaz)
- Rumuz max 20 karakter
- Cevap max 50 karakter
- Oda kodu 6 haneli sayı

## 9. Görsel Tasarım

- **Tema:** MUI Dark Theme (`palette.mode: 'dark'`)
- **Renkler:** Lacivert arka plan (#0a1929), açık mavi primary (#90caf9), mor secondary (#ce93d8)
- **Font:** Inter + Roboto
- **Border radius:** 16px genel, 12px butonlar
- **Glassmorphism:** Kartlarda `backdrop-filter: blur(12px)`
- **İkonlar:** `@mui/icons-material` + Unicode emojiler

## 10. Mevcut Durum (v1.0)

- [x] Giriş ekranı (rumuz + oda oluştur/katıl)
- [x] Lobi (oyuncu listesi, ayarlar, hazır durumu, sohbet)
- [x] SlotMachine (harf çarkı animasyonu)
- [x] Cevap tablosu (kategori inputları, zamanlayıcı)
- [x] Değerlendirme (kategori bazlı, tüm oyuncular tek sayfada)
- [x] Oylama şeffaflığı (kimin ne oy verdiği görünür)
- [x] Tur sonuçları (kümülatif puan + tur puanı)
- [x] Oyun sonu (final sıralaması)
- [x] Sohbet (lobi + oyun içi)
- [x] PeerJS signaling server (Render)
- [x] Vercel auto-deploy

### Bilinen Eksikler

- Oyuncu bağlantı koptuğunda otomatik `player-disconnected` broadcast edilmiyor
- Admin oyundan ayrılınca yetki devri yok
- Sayfa yenilemede oyun durumu kaybolur (state persist yok)
- Admin admin olmayan herkes ready olmasa bile "Oyuna Başla" yapabiliyor (kontrol eksik)

## 11. Geliştirme

```bash
# Bağımlılıklar
npm install
cd server && npm install

# Geliştirme (frontend)
npm run dev                    # http://localhost:5173

# Geliştirme (signaling server)
cd server && npm start         # http://localhost:9000

# Build
npm run build

# Lint (TypeScript check)
npm run lint
```

## 12. Çoklu Sekme Test

```
Sekme 1: http://localhost:5173 → "Oyuncu1" → Oda Oluştur
Sekme 2: http://localhost:5173 → "Oyuncu2" → Odaya Katıl (kodu gir)
Sekme 3: http://localhost:5173 → "Oyuncu3" → Odaya Katıl
...
```

Her sekme ayrı bir Peer instance oluşturur. İnternet gereklidir (PeerJS Cloud/Render signaling).

## 13. Gelecek Özellikler (v2+)

- Özel kategori oluşturma
- Oyun geçmişi / istatistik (localStorage)
- Ses efektleri
- Mobil responsive iyileştirmeleri
- Dark/light tema geçişi
- Oyuncu bağlantı kopması yönetimi
- Admin yetki devri
