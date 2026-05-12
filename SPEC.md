# İsim Şehir — Oyun Spesifikasyonu

## 1. Proje Özeti

**İsim Şehir**, klasik Türk kelime oyununun modern, çok oyunculu, peer-to-peer WebRTC tabanlı bir versiyonudur. Oyuncular oda oluşturup arkadaşlarını davet eder, seçtikleri kategorilerde ve belirlenen harfte kelimeler yazarak birbirlerine puan verir.

- **Platform:** Web (React SPA)
- **Multiplayer:** Peer-to-peer (WebRTC) via PeerJS
- **UI Kütüphanesi:** Material UI (MUI)
- **Dil:** Tamamen Türkçe
- **Kimlik:** Anonim / rumuz bazlı

---

## 2. Oyun Akışı (Game Flow)

### 2.1 Giriş Ekranı
- Kullanıcı bir rumuz girer
- "Oda Oluştur" veya "Odaya Katıl" seçeneği sunulur
- Odaya katılmak için 6 haneli oda kodu girilir

### 2.2 Oda (Lobi) — Admin Ayarları
Oda sahibi (admin) şu ayarları yapar:
- **Kategoriler:** Kapsamlı listeden seçim (min 2, max 10)
- **Tur sayısı:** 1–15
- **Süre:** 30sn / 60sn / 90sn / 120sn / limitsiz
- **Harf havuzu:** Tüm harfler veya sadece seçilen harfler (Ğ hariç tutulur)

Tüm oyuncular hazır olduğunda admin "Oyuna Başla" butonuna basar.

### 2.3 Harf Çarkı (Spinning Wheel)
- Her tur başında animasyonlu bir çark döner ve rastgele bir harf seçilir
- Seçilen harf ekranda büyük gösterilir
- 3 saniyelik bir bekleme ile cevap aşamasına geçilir

### 2.4 Cevap Aşaması
- Her oyuncu seçilen kategorilerin her biri için o harfle başlayan bir kelime yazar
- Zamanlayıcı çalışır (adminin seçtiği süre kadar)
- "Cevapları Gönder" butonu ile erken teslim edilebilir
- Süre bitince cevaplar otomatik gönderilir

### 2.5 Değerlendirme (Peer Grading) — Tek Tek
- Her oyuncunun cevapları tek tek gösterilir (kategori bazında sırayla)
- Diğer oyuncular her cevap için **"Geçerli"** veya **"Geçersiz"** oylaması yapar
- Oylar canlı olarak toplanır
- Admin gerekirse tartışmalı cevaplar için son sözü söyleyebilir

### 2.6 Puan Tablosu (Round Summary)
- Her tur sonunda puan durumu gösterilir
- Puanlar toplanır ve sıralama gösterilir

### 2.7 Oyun Sonu
- Tüm turlar bittiğinde nihai sıralama gösterilir
- Oyuncular lobiye dönebilir veya aynı ayarlarla tekrar oynayabilir

---

## 3. Puan Sistemi (Peer-Graded)

| Durum | Puan |
|---|---|
| Geçerli ve benzersiz cevap | 10 |
| Geçerli ama başkasıyla aynı cevap | 5 |
| Geçersiz / oylanarak reddedilmiş | 0 |
| Boş bırakılmış | 0 |

Aynı cevap kontrolü peer-to-peer olarak yapılır — istemci tarafında normalize edilmiş cevaplar karşılaştırılır.

---

## 4. Kategori Listesi (30+ Türkçe Kategori)

Aşağıdaki kategoriler ön tanımlı olarak gelir. Admin her oyun başında dilediklerini seçer:

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
32. Peri Bacaları / Turistik Yer (opsiyonel)

*Not: Tüm kategoriler Türkçe isimlendirilmiştir.*

---

## 5. Teknoloji Mimarisi

### 5.1 Frontend (React SPA)
- **Framework:** React + Vite
- **UI:** Material UI (MUI) v6+
- **State Management:** React Context + useReducer (veya Zustand)
- **Routing:** React Router v6+
  - `/` — Ana sayfa (giriş, oda oluştur/katıl)
  - `/room/:roomId` — Oda lobisi
  - `/game/:roomId` — Oyun ekranı

### 5.2 Peer-to-Peer (WebRTC)
- **Kütüphane:** PeerJS (client-only, PeerJS Cloud signaling sunucusu kullanılır, ek backend gerekmez)
- **Topoloji:** Mesh (herkes herkese bağlanır) — 6-8 oyuncuya kadar idealdir
- **Mesajlaşma:** JSON mesajları ile oda içi senkronizasyon

#### Mesaj Tipleri:
| Mesaj | Açıklama |
|---|---|
| `join-room` | Oyuncu odaya katıldı |
| `player-ready` | Oyuncu hazır |
| `game-start` | Oyun başladı (admin) |
| `round-start` | Yeni tur, harf seçildi |
| `answers-submit` | Cevaplar gönderildi |
| `vote` | Oyuncu oylaması |
| `round-end` | Tur sonuçları |
| `chat-message` | Sohbet mesajı |

### 5.3 Veri Yapıları

#### Player
```ts
interface Player {
  id: string
  nickname: string
  isAdmin: boolean
  isReady: boolean
  score: number
}
```

#### GameRoom
```ts
interface GameRoom {
  code: string          // 6 haneli kod
  adminId: string
  players: Player[]
  settings: GameSettings
  phase: 'lobby' | 'wheel' | 'answering' | 'grading' | 'round-results' | 'game-over'
  currentRound: number
  currentLetter: string | null
  rounds: Round[]
}
```

#### GameSettings
```ts
interface GameSettings {
  categories: string[]       // seçilen kategori isimleri
  totalRounds: number        // 1–15
  roundDuration: number | null  // saniye, null = limitsiz
  letterPool: string[]       // ['A','B','C',...] (Ğ hariç)
}
```

#### Round
```ts
interface Round {
  letter: string
  answers: Answer[]
  votes: Vote[]
}
```

#### Answer
```ts
interface Answer {
  playerId: string
  category: string
  value: string
}
```

#### Vote
```ts  
interface Vote {
  voterId: string
  answerId: string
  isValid: boolean
}
```

---

## 6. Ekranlar ve Bileşenler

### 6.1 Ana Sayfa (`/`)
- Rumuz giriş alanı
- "Oda Oluştur" butonu → `/room/:roomId`
- "Odaya Katıl" butonu + kod girişi → `/room/:roomId`

### 6.2 Oda Lobi (`/room/:roomId`)
- Oyuncu listesi (isim + hazır durumu)
- Admin için ayar paneli (kategoriler, tur sayısı, süre, harfler)
- Oda kodu gösterimi (paylaşmak için)
- Sohbet kutusu
- "Hazır" butonu (admin için "Başlat")

### 6.3 Oyun Ekranı (`/game/:roomId`)
- **Harf Çarkı:** Canvas/CSS animasyonu ile dönen çark
- **Cevap Tablosu:** Kategoriler × cevap inputları
- **Zamanlayıcı:** Geri sayım
- **Değerlendirme Ekranı:** Cevap teker teker gösterilir, geçerli/geçersiz butonları
- **Puan Tablosu:** Sıralama listesi

---

## 7. Kurallar ve Kısıtlamalar

- **Ğ** harfi asla seçilmez (Türkçe'de Ğ ile başlayan kelime yok denecek kadar az)
- Oyuncu sayısı: min 2, max 8 (mesh bağlantı limiti)
- Aynı odada aynı rumuz kullanılamaz
- Cevap gönderildikten sonra geri alınamaz
- Oylama sırasında oy veren oyuncu değişiklik yapamaz

---

## 8. Gelecek Özellikler (v2+)

- Özel kategori oluşturma
- Oyun geçmişi / istatistik (localStorage)
- Ses efektleri
- Mobil uyumlu responsive tasarım
- Karanlık mod
- Engelli oyuncular için erişilebilirlik

---

## 9. Klasör Yapısı (Önerilen)

```
isim-sehir/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Lobby/
│   │   ├── Game/
│   │   │   ├── SpinningWheel.tsx
│   │   │   ├── AnswerTable.tsx
│   │   │   ├── GradingPanel.tsx
│   │   │   └── Scoreboard.tsx
│   │   ├── RoomList/
│   │   └── common/
│   ├── context/
│   │   ├── GameContext.tsx
│   │   └── PeerContext.tsx
│   ├── hooks/
│   │   ├── usePeer.ts
│   │   └── useGame.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── categories.ts
│   │   ├── scoring.ts
│   │   └── letters.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

---

## 10. Bağımlılıklar (Dependencies)

```json
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "@mui/material": "^6",
    "@mui/icons-material": "^6",
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "peerjs": "^1.5",
    "zustand": "^5"
  },
  "devDependencies": {
    "vite": "^6",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  }
}
```

---

## 11. PeerJS Cloud Sinyalleşme

PeerJS varsayılan olarak `0.peerjs.com` cloud sunucusunu kullanır. Bu sayede:

- **Backend gerekmez** — sadece statik frontend deploy edilir
- Her kullanıcı bir `Peer` instance'ı oluşturur
- Oda sahibinin peer ID'si oda kodu olarak kullanılır
- Diğer oyuncular bu peer ID'ye bağlanır

---

## 12. Değerlendirme (Peer Grading) Detayı

1. Tüm cevaplar toplanır
2. Her oyuncu için sırayla (admin dahil):
   - Oyuncunun cevapları kategoriler halinde gösterilir
   - Diğer oyuncular her cevap için 👍 (Geçerli) / 👎 (Geçersiz) oylar
   - Oylar canlı sayılır
   - Çoğunluk ne ise o karar geçerli olur
   - Eşitlik durumunda adminin oyu belirleyicidir (admin de oy kullanır)
3. Geçerli sayılan cevaplar puan sistemine tabi tutulur
4. Bir sonraki oyuncunun cevaplarına geçilir

---

## 13. Harf Çarkı

- Dairesel çark 29 harfi (A-Z, Ğ hariç, İ dahil) eşit dilimlerde gösterir
- Animasyon: CSS `transform: rotate()` ile 3-5 saniyelik dönüş
- Hız yavaşlayarak durur
- Seçilen harf vurgulanır ve ekranda büyük fontla gösterilir
- Tüm oyuncularda aynı harf seçilir (admin tarafından belirlenir, tüm peerlere broadcast edilir)

---

## 14. Karanlık Tema & Görsel Tasarım

### 14.1 Material UI Dark Theme Yapılandırması

Material UI'nin `createTheme` API'si ile `palette.mode: 'dark'` kullanılarak karanlık tema uygulanır. Tüm UI bileşenleri bu temayı takip eder.

```ts
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',        // Açık mavi — butonlar, bağlantılar
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#ce93d8',        // Mor — vurgular, badge'ler
      light: '#f3e5f5',
      dark: '#ab47bc',
    },
    background: {
      default: '#0a1929',     // Koyu lacivert arka plan
      paper: '#1e2937',       // Kart / panel arka planı
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    success: {
      main: '#4caf50',        // Geçerli cevap yeşili
    },
    error: {
      main: '#ef5350',        // Geçersiz cevap kırmızısı
    },
    divider: 'rgba(255,255,255,0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 16,          // Modern yuvarlak köşeler
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',        // Tüm butonlar düz metin
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',      // Varsayılan gradienti kaldır
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
  },
})
```

- Tema, uygulama başlangıcında `ThemeProvider` ile sarılır
- Kullanıcı tercihi `localStorage`'a kaydedilir (opsiyonel olarak açık/koyu geçişi eklenebilir)
- Varsayılan olarak her zaman karanlık tema açık gelir

### 14.2 İkon ve Emoji Kullanımı

Material UI ikonları (`@mui/icons-material`) ve Unicode emojiler UI genelinde tutarlı şekilde kullanılır. Her ekran için ikon/emoji haritası:

| Ekran / Bileşen | İkon / Emoji | MUI İkon Adı | Açıklama |
|---|---|---|---|
| **Ana Sayfa** | | | |
| Uygulama logosu | 🎯 | `SportsEsports` | Oyun logosu |
| Rumuz alanı | 👤 | `Person` | Kullanıcı simgesi |
| Oda Oluştur | ➕ | `AddCircle` | Yeni oda |
| Odaya Katıl | 🔗 | `Link` | Odaya bağlan |
| Kod girişi | 🔑 | `VpnKey` | Kod giriş alanı |
| **Lobi** | | | |
| Oda kodu | 🏠 | `MeetingRoom` | Oda kodu kopyalama |
| Oyuncu listesi | 👥 | `Group` | Oyuncu sayısı |
| Hazır durumu | ✅ | `CheckCircle` / `HourglassEmpty` | Hazır / Bekliyor |
| Admin rozeti | 👑 | `Crown` | Oda sahibi |
| Ayarlar | ⚙️ | `Settings` | Oyun ayarları |
| Kategori seçimi | 📋 | `Checklist` | Kategori listesi |
| Tur sayısı | 🔄 | `Repeat` | Tur seçimi |
| Süre seçimi | ⏱️ | `Timer` | Süre ayarı |
| Sohbet | 💬 | `Chat` | Sohbet kutusu |
| Başlat butonu | 🚀 | `RocketLaunch` | Oyunu başlat |
| **Oyun Ekranı** | | | |
| Harf çarkı | 🎡 | `RotateRight` | Çark animasyonu |
| Zamanlayıcı | ⏳ | `HourglassTop` | Geri sayım |
| Cevap inputu | ✍️ | `Edit` | Cevap yazma alanı |
| Cevapları Gönder | 📤 | `Send` | Cevapları teslim et |
| **Değerlendirme** | | | |
| Geçerli | ✅👍 | `ThumbUp` | Doğrulama onayı |
| Geçersiz | ❌👎 | `ThumbDown` | Doğrulama reddi |
| Puan tablosu | 🏆 | `EmojiEvents` | Sıralama |
| **Genel** | | | |
| Yükleme | ⏳ | `HourglassTop` | Bekleme animasyonu |
| Hata | ⚠️ | `Warning` | Hata mesajı |
| Başarı | 🎉 | `Celebration` | Oyun sonu |
| Kopyala | 📋 | `ContentCopy` | Kod kopyalama |
| Yenile | 🔄 | `Refresh` | Sayfayı yenile |

- İkonlar butonların içinde metnin solunda gösterilir (`startIcon` prop'u ile)
- Emojiler doğrudan JSX içinde kullanılır, özellikle mesajlarda ve bildirimlerde
- Oyun sonu ekranında konfet efekti için `🎉🎊` emojileri animasyonlu gösterilir

### 14.3 Modern UI Tasarım Öğeleri

| Öğe | Uygulama |
|---|---|
| **Glassmorphism** | Kartlar ve panellerde `backdrop-filter: blur(12px)` ile yarı saydam cam efekti |
| **Gradient vurgular** | Butonlarda ve başlıklarda hafif gradient geçişleri |
| **Yumuşak gölgeler** | MUI `elevation` yerine özel `box-shadow` ile loş gölgeler |
| **Hover animasyonları** | Kartlar üzerine gelince hafif yükselme (`translateY(-2px)`) |
| **Kenarlık parlaması** | Aktif input/lobutlarda `border-color` geçişi |
| **Responsive grid** | MUI `Grid2` ile mobil ve masaüstü uyumlu düzen |
| **Micro-interactions** | Buton tıklamalarında `ripple` efekti (MUI varsayılanı) |

---

## 15. Test Planı — Adım Adım Doğrulama

### 15.1 Ön Koşullar / Ortam

| Gereksinim | Açıklama |
|---|---|
| Node.js | v18+ yüklü olmalı |
| Tarayıcı | Chrome / Firefox / Edge (güncel sürüm) |
| İnternet | PeerJS Cloud bağlantısı için gerekli (yerel testte de internet şart) |
| İkinci sekme / pencere | Çoklu oyuncu testi için aynı tarayıcıda ikinci bir sekme |

### 15.2 Test Senaryoları

Aşağıdaki her test adımı sırasıyla uygulanır. Her adım başarılı olmadan bir sonraki adıma geçilmez.

#### Aşama 1: Uygulama Başlatma

1. `npm install` komutu çalıştırılır — hata alınmamalı
2. `npm run dev` ile geliştirme sunucusu başlatılır — `http://localhost:5173` açılır
3. Ana sayfa sorunsuz yüklenir — karanlık tema görünür, tüm metinler Türkçe
4. Konsolda (F12) hiçbir hata/uyarı olmamalı

#### Aşama 2: Ana Sayfa — Oda Oluşturma

1. 👤 **Rumuz girme:** `"Oyuncu1"` yazılır, metin alanı çalışır
2. Boş rumuzla "Oda Oluştur" tıklanır — hata mesajı gösterilmeli ("Lütfen bir rumuz girin")
3. Rumuz girilip ➕ **"Oda Oluştur"** tıklanır — `/room/:roomId` sayfasına yönlendirilir
4. Lobi sayfasında 6 haneli oda kodu görünür
5. 👑 Admin rozeti doğru şekilde "Oyuncu1" üzerinde görünür

#### Aşama 3: Lobi — Odaya Katılma (Çoklu Sekme)

1. **Aynı tarayıcıda yeni bir sekme açılır** — `http://localhost:5173`
2. İkinci sekmede rumuz: `"Oyuncu2"` yazılır
3. 🔗 **"Odaya Katıl"** tıklanır, 6 haneli kod (ilk sekmelerden alınan) girilir
4. "Oyuncu2" lobide görünür
5. Her iki oyuncunun da lobide hazır durumu ⏳ "Hazır Değil" olarak gösterilir
6. **Aynı rumuz testi:** `"Oyuncu1"` ile katılmayı dener — hata mesajı: "Bu rumuz zaten kullanılıyor"

> **🔁 3. ve 4. oyuncuları da ekleyin:** "Oyuncu3", "Oyuncu4" ile aynı adımları tekrarlayın. Toplam 4 oyuncu lobide görünmeli.

#### Aşama 4: Lobi — Oyun Ayarları

1. Admin (Oyuncu1) ⚙️ **"Oyun Ayarları"** panelini açar
2. 📋 **Kategori seçimi:** En az 2, en fazla 10 kategori seçilebilir
   - 1 kategoriden az seçiliyken kaydetmeyi dene → uyarı: "En az 2 kategori seçmelisiniz"
   - 3 kategori seç (örn: İsim, Şehir, Hayvan)
3. 🔄 **Tur sayısı:** 3 olarak ayarlanır
4. ⏱️ **Süre:** 60 saniye seçilir
5. 🔤 **Harf havuzu:** "Tüm Harfler" seçilir
6. Ayarlar kaydedilir — diğer oyuncularda ayarlar güncellenir (lorum)

#### Aşama 5: Lobi — Hazır Olma

1. Admin "Hazır" butonuna tıklar — ✅ "Hazır" olarak değişir
2. Diğer oyuncular sırayla "Hazır" olur
3. Tüm oyuncular hazır olduğunda adminin 🚀 **"Oyuna Başla"** butonu aktifleşir

#### Aşama 6: Oyun — Harf Çarkı

1. Admin "Oyuna Başla" tıklar — tüm oyuncularda 🎡 çark animasyonu başlar
2. Çark 3-5 saniye döner ve durur
3. Tüm oyuncularda aynı harf seçilir (örneğin: "A")
4. Seçilen harf tüm oyuncularda büyük fontla görünür
5. 3 saniye sonra otomatik cevap aşamasına geçilir

#### Aşama 7: Oyun — Cevap Verme

1. Her oyuncu seçilen kategoriler için cevaplar yazar:
   - **İsim (Erkek):** "Ahmet"
   - **Şehir (Türkiye):** "Ankara"
   - **Hayvan:** "At"
   - Oyuncunun kategoriye cevabı yoksa boş bırakabilir
2. ⏳ Zamanlayıcı geri sayar: 60, 59, 58...
3. Oyuncu erken bitirirse "Cevapları Gönder" butonuna basar
4. Süre bitince cevaplar otomatik gönderilir
5. Tüm oyuncular cevaplarını gönderene kadar beklenir

#### Aşama 8: Oyun — Değerlendirme (Peer Grading)

1. Her oyuncunun cevapları sırayla gösterilir
2. Diğer oyuncular her cevap için 👍 **"Geçerli"** veya 👎 **"Geçersiz"** oy verir
3. Oy veren oyuncunun oyu anında sayılır
4. Tüm oylar toplanana kadar beklenir
5. Eşitlik durumunda adminin oyu belirleyici olur

#### Aşama 9: Oyun — Tur Sonuçları

1. Her tur sonunda 🏆 **puan tablosu** gösterilir
2. Puanlar doğru hesaplanır:
   - Benzersiz geçerli cevap: 10 puan
   - Aynı cevap (başkasıyla aynı): 5 puan
   - Geçersiz/boş: 0 puan
3. Sıralama puana göre doğru listelenir
4. Sonraki tura geçilir

#### Aşama 10: Oyun Sonu

1. Tüm turlar tamamlanır
2. 🎉 **Final sıralaması** gösterilir — tüm oyuncuların toplam puanı ve sıralaması
3. "Lobiye Dön" ve "Tekrar Oyna" butonları çalışır
4. "Tekrar Oyna" aynı ayarlarla yeni oyun başlatır
5. "Lobiye Dön" ayar ekranına döndürür

#### Aşama 11: Sohbet

1. Lobi ve oyun ekranında 💬 sohbet kutusu bulunur
2. Mesaj yazılır ve gönderilir — tüm oyuncularda görünür
3. Özel mesajlaşma ve emoji desteği çalışır

#### Aşama 12: Bağlantı Kopması / Yeniden Bağlanma

1. Bir oyuncunun sekmeyi kapattığında diğer oyuncular "Oyuncu X ayrıldı" bildirimi alır
2. Aynı rumuzla tekrar katılmaya çalıştığında 30 saniye içinde bağlantı yenilenebilir
3. 30 saniye geçtikten sonra aynı rumuz tekrar kullanılabilir

---

## 16. Test Caseleri

### 16.1 Birim Testleri (Unit Tests)

| Test Kodu | Açıklama | Beklenen Sonuç |
|---|---|---|
| `UT-01` | Rumuz boş gönderilemez | "Lütfen bir rumuz girin" hatası |
| `UT-02` | Rumuz max 20 karakter | 21. karakter girilemez |
| `UT-03` | Oda kodu sadece 6 haneli sayı | Harf girilince hata |
| `UT-04` | Oda kodu geçersizse | "Geçersiz oda kodu" hatası |
| `UT-05` | Aynı odada aynı rumuz | "Bu rumuz zaten kullanılıyor" |
| `UT-06` | Kategori sayısı min 2 | 1 kategori seçiliyken hata |
| `UT-07` | Kategori sayısı max 10 | 11. kategori seçilemez |
| `UT-08` | Tur sayısı 1-15 arası | Negatif / 0 / 16 girilemez |
| `UT-09` | Cevap max 50 karakter | 51. karakter girilemez |
| `UT-10` | Ğ harfi seçilemez | Harf havuzunda Ğ yok |
| `UT-11` | Puan hesaplama: benzersiz | 10 puan |
| `UT-12` | Puan hesaplama: aynı cevap | 5 puan |
| `UT-13` | Puan hesaplama: boş/geçersiz | 0 puan |
| `UT-14` | Oyuncu sayısı min 2 | Tek oyuncuyla oyun başlamaz |
| `UT-15` | Oyuncu sayısı max 8 | 9. oyuncu katılamaz |
| `UT-16` | Cevap gönderildikten sonra geri alınamaz | Inputlar kilitlenir |
| `UT-17` | Oylama değiştirilemez | Oy verildikten sonra butonlar devre dışı |
| `UT-18` | Zamanlayıcı doğru çalışır | 60sn geri sayar, 0'da durur |
| `UT-19` | Tüm harfler (28 harf) seçilebilir | Sadece seçilenler havuzda |
| `UT-20` | Emoji metin alanında çalışır | Emoji girilip gönderilebilir |

### 16.2 Entegrasyon Testleri (Integration Tests)

| Test Kodu | Açıklama | Beklenen Sonuç |
|---|---|---|
| `IT-01` | 2 oyuncu oda oluşturup katılır | Her iki lobide de 2 oyuncu görünür |
| `IT-02` | 4 oyuncu aynı odada | Tüm oyuncular birbirini görür |
| `IT-03` | Tüm oyuncular hazır olunca başlatma | "Oyuna Başla" aktifleşir |
| `IT-04` | Çark tüm oyuncularda aynı harfi seçer | Harf tutarlı |
| `IT-05` | Tüm oyuncular cevap gönderir | Herkesin cevapları toplanır |
| `IT-06` | Peer grading akışı | Tüm oyuncular oylama yapabilir |
| `IT-07` | Puanlar doğru hesaplanır | Beklenen puanlar gelir |
| `IT-08` | Çok turlu oyun (3 tur) | 3 tur sorunsuz tamamlanır |
| `IT-09` | Sohbet mesajı tüm oyuncularda görünür | Mesaj broadcast edilir |
| `IT-10` | Admin oyundan ayrılır | Admin yetkisi başkasına devredilir |

### 16.3 Uç Hizmet Testleri / Edge Cases

| Test Kodu | Açıklama | Beklenen Sonuç |
|---|---|---|
| `EC-01` | Tüm oyuncular aynı cevabı yazar | Herkes 5 puan alır |
| `EC-02` | Bir oyuncu tüm cevapları boş bırakır | 0 puan, oylamaya gerek kalmaz |
| `EC-03` | Çok uzun rumuz (21+ karakter) | Kesilir / hata verir |
| `EC-04` | Özel karakterler içeren rumuz | Temizlenir veya kabul edilmez |
| `EC-05` | İnternet bağlantısı oyun sırasında kopar | Oyuncu "bağlantı koptu" olarak işaretlenir |
| `EC-06` | Aynı kelime farklı kategorilerde | Her kategoride ayrı değerlendirilir |
| `EC-07` | 30 saniye süreyle hızlı oyun | Süre bittiğinde otomatik gönderim |
| `EC-08` | Oda kodu kopyala/yapıştır | Kod panoya kopyalanır |
| `EC-09` | Sayfa yenileme (F5) | Oyun durumu kaydedilmişse kaldığı yerden devam |
| `EC-10` | limitsiz süre seçeneği | Zamanlayıcı görünmez, manuel gönderim |

---

## 17. Çok Sekmeli Yerel Test (Local Multi-Tab Testing)

### 17.1 Amaç

Geliştirme sırasında uygulamayı birden fazla kullanıcıyla test edebilmek için aynı bilgisayarda farklı tarayıcı sekmeleri/pencereleri kullanılır. PeerJS WebRTC bağlantıları cloud sunucu üzerinden yapıldığı için aynı makineden yapılan bağlantılar sorunsuz çalışır.

### 17.2 Adımlar

```
1. Terminal: npm run dev          → http://localhost:5173
2. Sekme 1:  http://localhost:5173 → "Oyuncu1" rumuzu ile "Oda Oluştur"
3. Sekme 2:  http://localhost:5173 → "Oyuncu2" rumuzu ile "Odaya Katıl" (kodu gir)
4. Sekme 3:  http://localhost:5173 → "Oyuncu3" rumuzu ile "Odaya Katıl"
5. Sekme N:  http://localhost:5173 → "OyuncuN" rumuzu ile "Odaya Katıl"
```

> **⚠️ ÖNEMLİ NOTLAR:**
> - Her sekmede **farklı bir rumuz** kullanılmalıdır
> - PeerJS Cloud (`0.peerjs.com`) bağlantısı için **internet gerekir** — yerel ağda çalışmaz
> - Vite geliştirme sunucusu varsayılan olarak **aynı origin** üzerinden çalıştığı için (localhost:5173), tarayıcı sekmeleri arasında **Session Storage / Local Storage paylaşımına dikkat edilmelidir**
> - localStorage tabanlı state yönetimi kullanılıyorsa, her sekmeye **özel bir storage anahtarı** kullanılmalıdır (örn: `isimsehir_player_Oyuncu1`)

### 17.3 PeerJS ve Çoklu Sekme Kısıtlamaları

| Durum | Çalışır mı? | Açıklama |
|---|---|---|
| Aynı tarayıcı, farklı sekmeler | ✅ EVET | Her sekme ayrı bir Peer instance oluşturur |
| Aynı tarayıcı, farklı pencereler | ✅ EVET | Aynı mantık |
| Farklı tarayıcılar (Chrome + Firefox) | ✅ EVET | PeerJS cloud üzerinden bağlanır |
| İnternet olmadan (sadece localhost) | ❌ HAYIR | PeerJS Cloud signaling gerekli |
| Farklı bilgisayarlar (aynı ağ) | ✅ EVET | Her biri ayrı Peer instance |

### 17.4 Test için Önerilen Yapılandırma

```
En ideal test senaryosu:
- 1 bilgisayar + aynı tarayıcıda 4 sekme
- Veya: 2 bilgisayar, her birinde 2 tarayıcı sekmesi
```

**Hızlı test komutu** (Vite ile):
```bash
npm run dev
# Çıktı: http://localhost:5173
```

Her sekmede aynı URL açılır, farklı rumuzlarla giriş yapılır. Aynı oda kodu kullanılarak tüm oyuncular aynı odaya bağlanır.

### 17.5 Olası Sorunlar ve Çözümleri

| Sorun | Olası Neden | Çözüm |
|---|---|---|
| Oyuncu katılamıyor | PeerID çakışması | Sayfayı yenile (F5) ve tekrar dene |
| Bağlantı koptu | PeerJS Cloud timeout | 5 saniye bekle, otomatik yeniden bağlanmayı dene |
| localStorage çakışması | Aynı storage key | Her sekme için unique storage prefix kullan |
| Ses/bildirim gelmiyor | Tarayıcı izni | Tarayıcı ayarlarından bildirim iznini kontrol et |
| Kamera/mikrofon isteği | WebRTC gerekmiyor | WebRTC sadece data channel kullanır, reddedilebilir |

---

## 18. Geliştirme ve Dağıtım

### 18.1 Yerel Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Derleme
npm run build

# Production preview
npm run preview
```

### 18.2 Derleme ve Deploy

Statik dosyalar olarak derlenir (`dist/` klasörü). Herhangi bir statik host (Vercel, Netlify, GitHub Pages) veya basit bir HTTP sunucusu ile dağıtılabilir:

```bash
# Build
npm run build

# Statik sunucu ile çalıştırma (opsiyonel)
npx serve dist
```
