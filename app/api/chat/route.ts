import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, resumeContext, detectedSkills, elapsedMinutes = 0 } = await req.json();
    
    // LOG 1: Check if request reached the server
    console.log("API: Received request with", messages.length, "messages. Elapsed time:", elapsedMinutes, "minutes.");

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

    const prompt = `
      You are an expert technical interviewer. 
      Based on the conversation history below, ask the NEXT follow-up question.
      
      CANDIDATE CONTEXT:
      Skills: ${detectedSkills?.join(', ') || 'None provided'}
      Resume Snippet: ${resumeContext ? resumeContext.substring(0, 2000) : 'None provided'}
      
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