# 🤖 My AI Chat — ChatGPT Clone

A full-stack ChatGPT-like app built with **Next.js 14**, **xAI Grok**, **Neon PostgreSQL**, and **Google Auth**. Deploy free on Vercel.

---

## ✨ Features
- 💬 Streaming AI responses (xAI Grok)
- 🔐 Google login via NextAuth
- 🗂️ Chat history saved in Neon PostgreSQL
- 🌙 Dark mode sidebar (ChatGPT-style)
- 📱 Mobile responsive
- ⚡ Deploy-ready for Vercel

---

## 🚀 Setup Guide

### 1. Clone & Install
```bash
git clone <your-repo>
cd chatgpt-clone
npm install
```

### 2. Get Your API Keys

#### xAI API Key
- Go to [x.ai/api](https://x.ai/api)
- Create a key — copy it

#### Google OAuth
- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (dev)
  - `https://your-app.vercel.app/api/auth/callback/google` (prod)

#### Neon Database
- Go to [neon.tech](https://neon.tech) and create a free project
- Copy the connection string from the dashboard

### 3. Create `.env.local`
```env
XAI_API_KEY=xai-your-key-here

GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

NEXTAUTH_SECRET=run-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.aws.neon.tech/neondb?sslmode=require
```

### 4. Run Locally
```bash
npm run dev
# Visit http://localhost:3000
```

### 5. Initialize Database
After first run, visit:
```
http://localhost:3000/api/init?secret=YOUR_NEXTAUTH_SECRET
```
This creates the `chats` and `messages` tables.

---

## 🌐 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add all env variables in Vercel dashboard (Settings → Environment Variables):
   - `XAI_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`
   - `DATABASE_URL`
4. Deploy!
5. After deploy, visit `https://your-app.vercel.app/api/init?secret=YOUR_NEXTAUTH_SECRET` to init DB

---

## 📁 Project Structure
```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Google auth
│   │   ├── chat/                 # Streaming AI endpoint
│   │   ├── chats/                # Chat CRUD
│   │   └── init/                 # DB init (run once)
│   ├── auth/signin/              # Sign in page
│   ├── chat/
│   │   ├── page.tsx              # New chat
│   │   └── [id]/page.tsx         # Existing chat
│   └── layout.tsx
├── components/
│   ├── Sidebar.tsx               # Chat history sidebar
│   ├── ChatArea.tsx              # Main chat UI
│   ├── MessageBubble.tsx         # Message renderer (markdown)
│   └── AuthProvider.tsx
├── lib/
│   ├── auth.ts                   # NextAuth config
│   └── db.ts                     # Neon DB client
└── middleware.ts                 # Route protection
```

---

## 🎨 Customization

**Change AI model** — in `app/api/chat/route.ts`:
```ts
model: "grok-3"           // most powerful
model: "grok-3-mini"      // faster, cheaper
```

**Change system prompt** — in `app/api/chat/route.ts`, add to messages:
```ts
{ role: "system", content: "You are a helpful assistant." }
```
