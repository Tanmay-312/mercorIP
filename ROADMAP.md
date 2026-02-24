# 🗺️ Project Roadmap

The AI Interviewer is fully functional for standard candidate testing.

## Completed Milestones (v1)

- ☑️ Full Audio Synthesis (Text-to-Speech)
- ☑️ Robust Vector Database RAG (Embeddings)
- ☑️ Video/Facial Emotion Analytics
- ☑️ Dynamic Tech-Stack Adapters

## Future Milestones (v2)

### 1. 👥 Multi-Agent Interview Panels

**Current limitation:** The candidate is only interviewed by a single AI persona.
**Improvement:** Introduce multiple AI agents acting as a panel (e.g., a Hiring Manager, a Senior Architect, and an HR Representative), each evaluating different vectors of the candidate's responses simultaneously.

### 2. 💻 Integrated Code Editor (Live Coding)

**Current limitation:** The app evaluates verbal technical knowledge but cannot test raw coding ability.
**Improvement:** Integrate a Monaco-based code editor and execution sandbox directly into the interview UI to allow live algorithmic problem-solving tests.

### 3. 💬 Slack & Discord Integrations

**Current limitation:** Interview results are locked into the web dashboard.
**Improvement:** Build webhooks and bot integrations to instantly push interview scorecards and summaries to a company's Slack or Discord channel the moment a candidate finishes.

### 4. 🔗 Automated Job Matching

**Current limitation:** It evaluates candidates but doesn't suggest next steps.
**Improvement:** Tie the final analytics output into a job board API (like LinkedIn or Indeed) to automatically surface roles the candidate is highly qualified for based on their interview performance.

### 5. Scoring redefining

**Current limitation:** The score given is always less than what it should have been (eg. despite a good interview, the score was 4/10, it should have been 8/10).
**Improvement:** Redefine the scoring system to give a more accurate representation of the candidate's performance.
