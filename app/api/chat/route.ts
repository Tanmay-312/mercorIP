import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // LOG 1: Check if request reached the server
    console.log("API: Received request with", messages.length, "messages");

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 200 }
    });

    // We transform your message history into a simple prompt string for Gemini
    const chatHistory = messages
      .map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
      .join('\n');

    const prompt = `
      You are an expert technical interviewer. 
      Based on the conversation history below, ask the NEXT follow-up question.
      
      RULES:
      1. Be concise (1-2 sentences).
      2. If the candidate was vague, ask for technical specifics.
      3. Do not break character.
      
      CONVERSATION HISTORY:
      ${chatHistory}
      
      NEXT INTERVIEWER QUESTION:
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