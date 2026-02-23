# 🗺️ Project Roadmap

The AI Interviewer is fully functional for standard candidate testing, but there are several major expansions planned for future iterations.

## Future Milestones

### 1. 🗣️ Full Audio Synthesis (Text-to-Speech)

**Current limitation:** The AI generates text responses which the candidate must read off the screen.
**Improvement:** Integrate the Web Speech Synthesis API or a third-party pipeline (like ElevenLabs or OpenAI TTS) to give the AI Interviewer a literal voice, creating a completely screen-free phone-call-like experience.

### 2. 🗄️ Robust Vector Database RAG

**Current limitation:** The candidate's resume context is forcefully jammed into the system prompt's context window. If a resume is massive, this can blow out token limits.
**Improvement:** Implement a RAG (Retrieval-Augmented Generation) pipeline. Chunk the resume on upload, store the embeddings in a Supabase pgvector column, and only pull the most relevant resume segments into the prompt based on the candidate's current conversational topic.

### 3. 📹 Video/Facial Emotion Analytics

**Current limitation:** The web UI enables the user's camera but does practically nothing with the feed aside from rendering it to the screen.
**Improvement:** Implement lightweight browser-side neural networks (like `face-api.js` or MediaPipe) to track candidate eye contact, micro-expressions, and visual confidence during the interview, looping this data back into the final analytical scorecard.

### 4. 🔀 Dynamic Tech-Stack Adapters

**Current limitation:** The AI prompt is generalized as a "Senior Technical Interviewer".
**Improvement:** Allow the user to select the specific _type_ of interview before starting (e.g., "System Design", "Frontend React Optimization", "Core Algorithms"). Route these selections natively to entirely different Gemini system prompts for vastly different interview vectors.
