# KingdomSol — Full Deployment Guide

## 🏰 Project Overview

KingdomSol is a Solana-powered African-inspired card game built with Next.js 14. A time traveller stranded in 2030 must rebuild their ancient wealth in SOL by playing a strategic card game rooted in the WHOT tradition.

---

## 📁 Project Structure

```
kingdomsol/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root HTML layout, fonts, metadata
│   │   └── page.tsx            # App Shell — routes between all screens
│   ├── components/
│   │   ├── cards/
│   │   │   └── GameCard.tsx    # Card SVGs (Manilla, Amole, Spearhead, Bead, Cowrie)
│   │   ├── game/
│   │   │   └── GameBoard.tsx   # Screen 02: Full game board with timer & interactions
│   │   ├── ui/
│   │   │   ├── LoadingScreen.tsx  # Screen 00: Spinning cowry, 2s splash
│   │   │   ├── MenuScreen.tsx     # Screen 01: Animated cards BG, character select
│   │   │   └── XPBar.tsx          # Screen 05: XP system + Profile screen
│   │   └── wallet/
│   │       └── WalletChip.tsx  # Screen 03+04: Phantom/Backpack modal + token picker
│   ├── lib/
│   │   └── store.ts            # Zustand store: full game state, bot AI, XP logic
│   └── styles/
│       └── globals.css         # African design system, card animations, kente patterns
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js              # Static export config for Vercel
└── vercel.json                 # Vercel deployment config
```

---

## 🚀 Deploy to Vercel (Step-by-Step)

### Option A: Deploy via GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   cd kingdomsol
   git init
   git add .
   git commit -m "feat: initial KingdomSol game"
   git remote add origin https://github.com/YOUR_USERNAME/kingdomsol.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project
   - Import your GitHub repository
   - Vercel auto-detects Next.js — click **Deploy**
   - Your game is live at `https://kingdomsol.vercel.app` in ~90 seconds

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# From your project root
cd kingdomsol
vercel

# Follow prompts:
# ? Set up and deploy? → Y
# ? Which scope? → Your account
# ? Link to existing project? → N
# ? What's your project's name? → kingdomsol
# ? In which directory is your code? → ./
# Detected Next.js → Deploy!
```

### Option C: Drag & Drop

```bash
# Build the static export
npm run build

# This generates an `out/` folder
# Go to vercel.com → New Project → drag the `out/` folder → Deploy
```

---

## 🛠️ Local Development

```bash
# Clone / navigate to project
cd kingdomsol

# Install dependencies
npm install

# Start dev server
npm run dev
# → Open http://localhost:3000

# Production build
npm run build
npm start
```

---

## 🎮 Game Screens

| Screen | File | Description |
|--------|------|-------------|
| `loading` | `LoadingScreen.tsx` | 2s splash with spinning cowry logo |
| `menu` | `MenuScreen.tsx` | Animated floating cards, character select, mode picker |
| `board` | `GameBoard.tsx` | Full game with hand, pile, timer, opponent display |
| `profile` | `XPBar.tsx` | Player stats, XP bar, game history |
| Wallet Modal | `WalletChip.tsx` | Phantom/Backpack connect, token picker, stake amount |

---

## 🃏 Card Suits & Special Actions

| Suit | Symbol | Special Card | Action |
|------|--------|-------------|--------|
| **Manilla** | Horseshoe ring | Ace (1) | Hold On — next player skips |
| **Amole** | Salt bars | 2 | Pick Two |
| **Spearhead** | Iron spear | 5 | Pick Four |
| **Bead** | Trade beads | 14 | General Market — everyone draws |
| **Cowrie** | Cowrie shell | 8 | Suspension |
| **Any** | WHOT | WHOT | Wild — call any suit |

---

## 👥 Characters

| Character | Origin | Ability |
|-----------|--------|---------|
| **Okonkwo** | Igbo, West Africa | Trade Mastery: Play 2 same-value cards |
| **Amara** | Mali Empire | Future Sight: Peek top 3 deck cards |
| **Zara** | Carthage, North Africa | Evasion: Cancel one Pick-2 or Pick-4 |
| **Kofi** | Ashanti Kingdom | Golden Touch: WHOT wins = double SOL |
| **Nefertari** | Ancient Egypt | Royal Decree: Change suit without WHOT |

---

## 💰 Supported Tokens

- **SOL** — Solana native
- **USDC** — Stable coin
- **BONK** — Meme token
- **JUP** — Jupiter DEX token
- **WIF** — dogwifhat

---

## 🎨 Design System

- **Display font**: Cinzel Decorative (regal, ancient-inspired)
- **Body font**: Crimson Pro (editorial, warm)
- **Mono font**: Space Mono (technical, on-chain)
- **Primary gold**: `#E8B84B` — ancient wealth
- **Solana purple**: `#9945FF`
- **Solana green**: `#14F195`
- **Background**: `#1A1410` — obsidian/earth
- **Pattern**: Kente cloth geometric repeating grid

---

## 🔌 Future Integrations

### Real Wallet Connection
```tsx
// Replace mock connectWallet with:
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { useWallet } from '@solana/wallet-adapter-react';

const { connect, publicKey } = useWallet();
```

### On-chain Stakes
```tsx
// Add to GameBoard.tsx when a game starts:
import { Connection, Transaction, SystemProgram } from '@solana/web3.js';

const stakeSOL = async (amount: number) => {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  // Build and send stake transaction
};
```

### NFT Character Minting
```tsx
// Use Metaplex to mint characters as NFTs:
import { Metaplex } from '@metaplex-foundation/js';
```

### Multiplayer Backend
- Use **Supabase Realtime** or **Socket.io** for live multiplayer
- Store game state in Supabase tables
- Add room codes for friend invites

---

## 📱 Mobile Optimization

The game is responsive. For native mobile:
```bash
npx cap init KingdomSol com.kingdomsol.app
npm install @capacitor/core @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

---

## 🌍 Environment Variables (for production)

```env
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
```

Add these in Vercel: **Project → Settings → Environment Variables**

---

## 📊 Vercel Analytics

Add to `layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';
// <Analytics /> in body
```

---

*Built with ❤️ for the Solana ecosystem. Ancient wisdom, modern chain.*
