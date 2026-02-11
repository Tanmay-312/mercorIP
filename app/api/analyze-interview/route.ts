import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE_ROLE_KEY for server-side updates to bypass RLS issues
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Server configuration error: Missing Supabase credentials');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

const getModel = () => {
  if (!GOOGLE_API_KEY) throw new Error('Missing GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  // Using 1.5-flash for faster, cheaper analysis with high reasoning
  return genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: "application/json" } // Force JSON mode
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, transcript, duration, avgResponseTime, interviewHistory = [] } = body;

    if (!userId || !transcript) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const model = getModel();
    const supabase = getSupabaseAdmin();

    const analysisPrompt = `
      You are a Senior Technical Interviewer. Analyze the following transcript.
      
      TRANSCRIPT: ${transcript}
      METRICS: Duration ${duration}m, Avg Response ${avgResponseTime}s.
      
      Compare against recent history if available: ${JSON.stringify(interviewHistory.slice(-2))}

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

    const interviewRecord = {
      date: new Date().toISOString(),
      duration: Number(duration.toFixed(2)),
      avgResponseTime: Number(avgResponseTime.toFixed(2)),
      scores: {
        overall: analysis.overallScore,
        technical: analysis.technicalDepth,
        communication: analysis.communication,
      },
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      actionableTips: analysis.actionableTips,
      comparisonNotes: analysis.comparisonNotes,
      summary: analysis.summary,
      // Store full transcript if needed, but slice to avoid column limits
      transcript: transcript.slice(0, 2000), 
    };

    // Keep only last 10 interviews to prevent DB row bloating
    const updatedHistory = [...interviewHistory, interviewRecord].slice(-10);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ interview_history: updatedHistory })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, analysis });

  } catch (error: any) {
    console.error('Analysis Pipeline Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}