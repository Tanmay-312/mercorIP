# 🤝 Contributing to AI Interviewer

First all, thank you for deciding to contribute! This document outlines how to get the project spinning locally.

## Development Setup

### 1. Prerequisites

You must have the following installed on your machine:

- Node.js (`v18.x` or higher)
- npm or yarn

### 2. Environment Variables

Copy the `.env.example` file to create your own local `.env`.

```bash
cp .env.example .env
```

You are required to provide 3 distinct keys:

1.  **Google AI API Key:** Get this from [Google AI Studio](https://aistudio.google.com/). It allows the system to boot up the Gemini models (`gemini-2.5-flash-lite`).
2.  **Supabase URL:** You must create a new project in Supabase.
3.  **Supabase Anon Key:** The public-facing client key for your Supabase project.

_Note: You do not need a service_role key to run the project. The codebase is deliberately architected to let the securely authenticated client UI execute the database inserts._

### 3. Database Schema

You will need a `profiles` table in your Supabase project with at least the following columns:

- `id` (uuid, primary key, matches auth.users)
- `full_name` (text)
- `skills` (text array)
- `projects` (jsonb array)
- `resume_metadata` (jsonb)
- `interview_history` (jsonb array)

### 4. Running the Project

Install the dependencies:

```bash
npm install
```

Boot the development server:

```bash
npm run dev
```

The server will generally bind to `http://localhost:3000`.

## How to Contribute

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a native Pull Request.

### Code Style

- We use **ESLint** and **Prettier** internally. Make sure to run `npm run lint` before committing your code to guarantee there are no lingering React Hook errors or typescript mismatches.
