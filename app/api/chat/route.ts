import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { messages, resumeData, interviewHistory } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = `You are a strict, professional technical recruiter conducting an in-depth interview.

CANDIDATE PROFILE:
- Skills: ${resumeData.skills?.join(', ') || 'Not specified'}
- Projects: ${JSON.stringify(resumeData.projects || [], null, 2)}

YOUR ROLE:
1. Ask deep, project-specific questions based on their resume
2. Probe technical details, architectural decisions, and problem-solving approaches
3. Challenge vague answers and request specific examples
4. Assess both technical depth and communication clarity
5. Be professional but demanding - this is a senior-level interview

INTERVIEW STYLE:
- Start with resume verification, then dive into technical depth
- Ask follow-up questions to clarify unclear answers
- Request code examples or system design explanations when relevant
- Evaluate their ability to explain complex concepts clearly

Keep your questions focused and professional. Ask ONE question at a time.`;

    const conversationHistory = messages
      .map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `${systemPrompt}\n\nCONVERSATION SO FAR:\n${conversationHistory}\n\nInterviewer:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ message: text });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: error.message },
      { status: 500 }
    );
  }
}
