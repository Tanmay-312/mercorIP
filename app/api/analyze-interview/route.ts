import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const getModel = () => {
  if (!GOOGLE_API_KEY) throw new Error('Missing GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  // Using 1.5-flash for faster, cheaper analysis with high reasoning
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite',
    generationConfig: { responseMimeType: "application/json" } // Force JSON mode
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, transcript, duration, avgResponseTime, interviewHistory = [], facialEmotions = null } = body;

    if (!userId || !transcript) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const model = getModel();

    const analysisPrompt = `
      You are a Senior Technical Interviewer. Analyze the following transcript.
      
      TRANSCRIPT: ${transcript}
      METRICS: Duration ${duration}m, Avg Response ${avgResponseTime}s.
      FACIAL ANALYTICS (Confidence/Nervousness): ${facialEmotions ? JSON.stringify(facialEmotions) : 'Not available'}
      
      Compare against recent history if available: ${JSON.stringify(interviewHistory.slice(-2))}

      SCORING GUIDELINES:
      - Provide scores on a scale of 1 to 10 (e.g., 8, 8.5, 9).
      - Do NOT be overly harsh. A solid, acceptable interview should score at least a 7.5 or 8.
      - A truly great interview should be a 9 or 10.
      - Only give below a 5 for an extremely poor, non-responsive, or completely incorrect interview.
      - Grade Technical Depth and Communication on the same generous scale.

      Output ONLY valid JSON with this schema:
      {
        "overallScore": number,
        "technicalDepth": number,
        "communication": number,
        "strengths": string[],
        "improvements": string[],
        "actionableTips": string[],
        "comparisonNotes": string,
        "summary": string
      }
    `;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();

    // Clean JSON parsing (handles potential Markdown backticks)
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleanedText);

    // Return the payload to the frontend so it can save to Supabase
    return NextResponse.json({ success: true, analysis });

  } catch (error: any) {
    console.error('Analysis Pipeline Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}