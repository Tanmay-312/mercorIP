<div align="center">

# 🚀 Mercor IP: AI Domain Expert Interviewer

**[🔗 Live Demo](https://mercor-ip.vercel.app/)** •
**[🏗️ Architecture](./ARCHITECTURE.md)** •
**[🗺️ Roadmap](./ROADMAP.md)** •
**[🤝 Contributing](./CONTRIBUTING.md)**

An intelligent, real-time mock interview platform that dynamically reads your resume and uses AI to conduct a technical, voice-first interview—tailored strictly to your domain expertise.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth/DB-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)

---

</div>

## 🌟 Key Features

- **📄 Intelligent Resume Parsing & RAG:** Upload your PDF resume. The system extracts core skills, chunks the text, and stores vector embeddings via Supabase. The AI uses local Retrieval-Augmented Generation (RAG) to ask deep, context-aware questions.
- **🎙️ Real-Time Voice Interaction (TTS):** Uses the native window `SpeechSynthesis` and `SpeechRecognition` APIs to create a completely conversational, screen-free phone-call-like experience.
- **📹 Video & Facial Emotion Analytics:** Leverages browser-side neural networks (`face-api.js`) to track candidate micro-expressions and visual confidence in real-time to compute a comprehensive behavioral scorecard.
- **🔀 Dynamic Tech-Stack Adapters:** Configure your Interview Type (e.g., System Design, Behavioral) and Experience Level before starting. The AI interviewer adapts its persona and strictness accordingly.
- **⏱️ Timed Sessions:** Interviews are tightly enforced to a realistic 10-minute cap with dynamic warnings.
- **📊 Post-Interview Analytics:** Generates an automatic scorecard (Technical Depth, Communication) with fair grading metrics, alongside actionable tips for improvement.

---

## 🚀 Deployment & Local Setup

### 1. Prerequisites

- Node.js (v18+)
- A [Google AI Studio API Key](https://aistudio.google.com/) (for Gemini 2.5)
- A [Supabase Project](https://supabase.com/) (for Authentication & PostgreSQL Database)

### 2. Run Locally

```bash
git clone https://github.com/tanmay-312/mercorIP.git
cd mercorIP
npm install
```

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_gemini_api_key
```

Start the development server:

```bash
npm run dev
```

Navigate to `http://localhost:3000`.

### 3. Docker Deployment

A `Dockerfile` is included for rapid containerized deployment utilizing the Next.js `standalone` build output.

```bash
docker build -t mercorip .
docker run -p 3000:3000 --env-file .env mercorip
```

### 4. Vercel / Netlify Deployment

This Next.js App Router project is perfectly optimized for edge deployments.

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
3. Add your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GOOGLE_API_KEY` to the environment variables settings.
4. Deploy!
