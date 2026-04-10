# Fajr Alarm - Smart Wake Up PWA

A mobile-first Progressive Web App that helps users wake up for Fajr (or any prayer/custom time) using a smart alarm system that **requires scanning a QR code** to dismiss — forcing you to physically get out of bed.

## Features

### Smart Alarm System
- Set alarms for any time, or auto-sync with **calculated prayer times** (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Prayer times are computed astronomically based on your GPS location
- Repeat alarms on selected days of the week
- Visual countdown to next alarm

### QR Code Dismissal
- Alarm **cannot be dismissed** without scanning a QR code
- Generate a **cryptographically signed, device-locked** QR code unique to your phone
- Download or print the QR code and place it far from your bed (e.g., near your bathroom)
- HMAC-SHA256 signed with device fingerprinting — cannot be forged or shared between devices

### Progressive Web App
- Installable on any mobile device (Android/iOS) from the browser
- Offline support via service worker caching
- Push notifications for alarm alerts
- Wake Lock API keeps the screen on during alarm

### Beautiful UI
- Dark theme with Islamic/minimal aesthetic
- Smooth animations powered by Framer Motion
- 4-step animated onboarding flow
- Arabic calligraphy accents (Bismillah, prayer phrases)
- Mobile-first responsive design

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite 8 | Build tool & dev server |
| Framer Motion | Animations & transitions |
| qrcode.react | QR code generation |
| html5-qrcode | Camera-based QR scanning |
| lucide-react | Icon library |
| Web Crypto API | HMAC-SHA256 QR signing |
| Service Worker | Offline caching & notifications |
| Wake Lock API | Keeps screen on during alarm |

## Project Structure

```
src/
├── context/AppContext.tsx      # Global state management
├── utils/
│   ├── storage.ts             # LocalStorage + QR crypto (HMAC, fingerprint)
│   ├── prayer.ts              # Astronomical prayer time calculations
│   └── alarm.ts               # Alarm scheduling, notifications, wake lock
├── pages/
│   ├── Onboarding.tsx         # 4-step animated walkthrough
│   ├── Home.tsx               # Alarm list + prayer times dashboard
│   ├── QRCode.tsx             # QR generation, download, print
│   ├── AlarmRing.tsx          # Full-screen alarm with QR scan to dismiss
│   └── Settings.tsx           # Location, notifications, install prompt
├── components/
│   ├── AddAlarmModal.tsx      # Bottom sheet alarm creation
│   └── BottomNav.tsx          # Tab navigation
├── types/global.d.ts          # Wake Lock API types
├── App.tsx                    # Router & app shell
└── main.tsx                   # Entry point & SW registration
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Clone the repo
git clone https://github.com/<your-username>/fajr-alarm.git
cd fajr-alarm

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` on your phone or use Chrome DevTools mobile emulation.

### Build for Production

```bash
npm run build
npm run preview
```

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel auto-detects Vite — no config needed
5. Click **Deploy**

The app will be live at `https://your-project.vercel.app`

## How It Works

1. **Set an alarm** — pick a time manually or select a prayer time (auto-calculated from your location)
2. **Generate your QR code** — a unique, device-locked QR code is created using HMAC-SHA256
3. **Print & place the QR** — stick it near your bathroom or wash area
4. **When the alarm rings** — you MUST get up, walk to the QR code, and scan it with your camera to stop the alarm
5. **Make wudu and pray!**

## Known Limitations

| Limitation | Workaround |
|---|---|
| iOS restricts background audio/timers | Keep the app open in foreground |
| Browser may kill background tabs | Install as PWA + disable battery optimization |
| No guaranteed wake from deep sleep | Use alongside your phone's native alarm as backup |
| Camera permission required for QR scan | Grant permission when prompted |

## No Backend Required

The entire app runs client-side:
- Alarm data stored in **localStorage**
- QR secrets generated via **Web Crypto API** (`crypto.getRandomValues`)
- Prayer times computed locally using **astronomical formulas**
- No user accounts, no server, no data collection

## License

MIT
# fajr-alarm
