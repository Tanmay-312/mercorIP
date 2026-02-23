<div align="center">

# 🚀 Mercor IP

**[🏠 Home](https://github.com/tanmay-312/mercorIP)** •
**[🏗️ Architecture](https://github.com/tanmay-312/mercorIP/wiki/Architecture)** •
**[🗺️ Roadmap](https://github.com/tanmay-312/mercorIP/wiki/Roadmap)** •
**[🤝 Contributing](https://github.com/tanmay-312/mercorIP/blob/main/CONTRIBUTING.md)**

---

</div>

# 🤖 AI Domain Expert Interviewer

> An intelligent, real-time mock interview platform that dynamically reads your resume and uses AI to conduct a technical, voice-first interview—tailored strictly to your domain expertise.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth/DB-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)

---

## 🌟 Key Features

- **📄 Intelligent Resume Parsing:** Upload your PDF resume. The system automatically extracts your core skills and project histories to build a custom candidate profile.
- **🎙️ Real-Time Voice Interaction:** Uses the native Web Speech API (with robust text fallbacks) to allow a continuous, conversational interview experience without requiring typing.
- **🧠 Context-Aware AI Questions:** Powered by Google's Gemini 2.5 models. The AI evaluates your verbal responses against your literal resume, pushing you for specific technical details if your answers are too vague.
- **⏱️ Timed Sessions:** Interviews are tightly enforced to a realistic 10-minute cap. The AI intelligently transitions to a wrap-up phase during the final moments.
- **📊 Post-Interview Analytics:** Upon ending the session, the AI analyzes the entire transcript, generating an automatic scorecard (Technical Depth, Communication) alongside actionable tips for improvement.

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (v18+)
- A Google AI Studio API Key (for Gemini)
- A Supabase Project (for Authentication & Postgres DB)

### 2. Clone and Install

```bash
git clone https://github.com/tanmay-312/mercorIP.git
cd mercorIP
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory and populate it with your keys (see `.env.example` for reference):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_gemini_api_key
```

### 4. Run Locally

```bash
npm run dev
```

Navigate to `http://localhost:3000`. You can now sign up, upload a resume, and begin a mock interview!

---

## 🐳 Docker Deployment

A `Dockerfile` is included for containerized deployment, though the project is fully optimized for Vercel/Netlify.

```bash
docker build -t mercorIP .
docker run -p 3000:3000 --env-file .env mercorIP
```
