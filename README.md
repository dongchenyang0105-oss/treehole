# 🕳️ 树洞 Tree Hole

A private emotional journal with AI interaction. Your personal tree hole.

一个带 AI 互动的私人情绪日记。你的树洞——想说什么就说什么。

## Features

- **Three modes**: Mirror (直接指出模式), Listen (纯倾听), Knowledge (知识伙伴)
- **Cloud sync**: Login on any device, your data follows you (Supabase)
- **Periodic reports**: AI-generated emotional pattern summaries
- **Mobile-first PWA**: Add to home screen, use like a native app
- **Privacy**: Your API key stays on your device. Chat data is in your own Supabase project.

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open SQL Editor → paste contents of `supabase-setup.sql` → Run
3. Go to Settings → API → copy **Project URL** and **anon public key**

### 2. Local development

```bash
git clone https://github.com/YOUR_USERNAME/treehole.git
cd treehole
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase URL and anon key

npm run dev
```

Open `http://localhost:5173` → Register → Settings → paste your Anthropic API Key.

### 3. Deploy to Netlify

1. Push to GitHub
2. Go to [Netlify](https://app.netlify.com) → Add new site → Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Deploy

## How it works

```
You type
  → saved to Supabase (cloud)
  → sent to Claude API (via Netlify proxy)
  → response saved
  → displayed

Report page
  → reads your messages from Supabase
  → sends to Claude for pattern analysis
  → saves and displays summary
```

## Modes

| Mode | Behavior |
|------|----------|
| 镜子 (Mirror) | Points out repeating patterns. Won't sugarcoat. |
| 倾听 (Listen) | Receives emotions first. No analysis unless asked. |
| 知识伙伴 (Knowledge) | Explores topics, brings new perspectives. |

## Tech stack

- React 18 + Vite
- Supabase (Auth + PostgreSQL)
- Anthropic Claude API
- Netlify Functions (API proxy)
- PWA (vite-plugin-pwa)

## License

MIT
