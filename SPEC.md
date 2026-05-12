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

## 7. Kategori Listesi (33)

1. İsim (Erkek)
2. İsin (Kadın)
3. Şehir (Türkiye)
4. Şehir (Dünya)
5. Ülke (Dünya)
6. Başkent
7. Hayvan
8. Bitki / Çiçek
9. Meyve / Sebze
10. Eşya
11. Marka
12. Araba Markası
13. Teknoloji Markası
14. Ünlü (Sanatçı / Oyuncu)
15. Şarkıcı / Müzik Grubu
16. Film
17. Dizi
18. Çizgi Film / Animasyon Karakteri
19. Kitap
20. Yazar
21. Meslek
22. Spor Dalı
23. Futbol Takımı
24. Futbolcu
25. Yemek / Tatlı
26. İçecek
27. Renk
28. Giysi / Aksesuar
29. Müzik Aleti
30. Bilim İnsanı / Mucit
31. Dağ / Nehir / Göl
32. Mitolojik Karakter
33. Peri Bacaları / Turistik Yer

## 8. Kurallar ve Kısıtlamalar

- **Ğ** harfi asla seçilmez
- Oyuncu sayısı: min 2, max 8
- Aynı odada aynı rumuz kullanılamaz
- Cevap gönderildikten sonra geri alınamaz
- Oy admin "Sonuçları Göster" butonuna basana kadar değiştirilebilir
- Rumuz max 20 karakter
- Cevap max 50 karakter
- Oda kodu 6 haneli sayı

## 9. Görsel Tasarım

- **Tema:** Dark + Light tema desteği (`localStorage`'a kaydedilir)
- **Dark renkler:** Lacivert arka plan (#0a1929), açık mavi primary (#90caf9), mor secondary (#ce93d8)
- **Light renkler:** Açık gri arka plan (#f5f7fa), mavi primary (#1976d2), mor secondary (#9c27b0)
- **Toggle:** Sağ üst köşede 🌙/☀️ ikonu ile anlık geçiş
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
- [x] Oy admin sonuçları gösterene kadar değiştirilebilir
- [x] Dark/light tema geçişi (sağ üst köşe, localStorage)
- [x] Tur sonuçları (kümülatif puan + tur puanı)
- [x] Oyun sonu (final sıralaması)
- [x] Sohbet (lobi + oyun içi)
- [x] PeerJS signaling server (Render)
- [x] Vercel auto-deploy
- [x] 33 kategori

### Bilinen Eksikler

- Oyuncu bağlantı koptuğunda otomatik `player-disconnected` broadcast edilmiyor
- Admin oyundan ayrılınca yetki devri yok
- Sayfa yenilemede oyun durumu kaybolur (state persist yok)
- "Oyuna Başla" için admin dahil tüm oyuncuların hazır olması kontrolü eksik

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
- Oyuncu bağlantı kopması yönetimi
- Admin yetki devri
