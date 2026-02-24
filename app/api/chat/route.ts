import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, resumeContext, detectedSkills, elapsedMinutes = 0, interviewSettings, resumeChunks } = await req.json();
    
    // LOG 1: Check if request reached the server
    console.log("API: Received request with", messages.length, "messages. Elapsed time:", elapsedMinutes, "minutes.", "Settings:", interviewSettings);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { maxOutputTokens: 800 }
    });

    // We transform your message history into a simple prompt string for Gemini
    const chatHistory = messages
      .map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
      .join('\n');

    let timeInstruction = `4. The interview is currently at ${elapsedMinutes.toFixed(1)} minutes out of 10.`;
    
    // If we're at or past 10 minutes, aggressively force the wrap-up
    if (elapsedMinutes >= 10) {
      timeInstruction = `4. CRITICAL INSTRUCTION: The interview time limit of 10 minutes has been reached (${elapsedMinutes.toFixed(1)} minutes). YOU MUST CONCLUDE THE INTERVIEW NOW. Thank the candidate for their time, provide a brief concluding remark, and STATE CLEARLY that the interview is over and they can click "End Session". DO NOT ask any further questions.`;
    } else if (elapsedMinutes >= 8.5) {
      timeInstruction = `4. TIME WARNING: The interview is almost over (${elapsedMinutes.toFixed(1)}/10 minutes). Make this your final question or transition towards wrapping up.`;
    }

    const iType = interviewSettings?.type || 'Technical';
    const iLevel = interviewSettings?.level || 'Mid-Level';

    let relevantContext = resumeContext ? resumeContext.substring(0, 2000) : "None provided";
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || "";

    // Fast local RAG vector search
    if (resumeChunks && resumeChunks.length > 0 && lastUserMessage) {
       try {
         const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
         const queryEmbeddingRes = await embedModel.embedContent(lastUserMessage);
         const queryVector = queryEmbeddingRes.embedding.values;
         
         const similarities = resumeChunks.map((chunk: any) => {
            const dotProduct = chunk.embedding.reduce((sum: number, val: number, i: number) => sum + val * queryVector[i], 0);
            return { text: chunk.text, score: dotProduct };
         });
         
         similarities.sort((a: any, b: any) => b.score - a.score);
         // Inject the top 3 most relevant paragraphs dynamically
         relevantContext = similarities.slice(0, 3).map((c: any) => c.text).join("\n...\n");
         console.log("API: RAG Success, injected", similarities.length > 3 ? 3 : similarities.length, "chunks.");
       } catch (e) {
         console.error("RAG Context retrieval failed, falling back to truncated resume", e);
       }
    }

    const prompt = `
      You are an expert ${iType} interviewer conducting an interview for a ${iLevel} candidate. 
      Based on the conversation history below, ask the NEXT follow-up question.
      
      CANDIDATE CONTEXT:
      Skills: ${detectedSkills?.join(', ') || 'None provided'}
      Resume Snippet: ${relevantContext}
      
      RULES:
      1. Be concise (1-2 sentences).
      2. If the candidate was vague, ask for technical specifics bridging their answer with their resume.
      3. Do not break character.
      ${timeInstruction}
      
      CONVERSATION HISTORY:
      ${chatHistory}
      
      NEXT INTERVIEWER QUESTION/RESPONSE:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text().trim();

    // LOG 2: Check AI output
    console.log("API: Gemini responded with:", aiText);

    return NextResponse.json({ message: aiText });
  } catch (error: any) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}