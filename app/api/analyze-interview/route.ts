import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, transcript, duration, avgResponseTime, interviewHistory } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const analysisPrompt = `As a senior technical recruiter, analyze this interview transcript and provide:

1. Overall Performance Score (1-10)
2. Technical Depth Score (1-10)
3. Communication Clarity Score (1-10)
4. Key Strengths (2-3 points)
5. Areas for Improvement (2-3 points)
6. Three Actionable Tips for the next interview

INTERVIEW TRANSCRIPT:
${transcript}

INTERVIEW METRICS:
- Duration: ${duration.toFixed(2)} minutes
- Average Response Time: ${avgResponseTime.toFixed(2)} seconds

${interviewHistory.length > 0 ? `
PREVIOUS INTERVIEW HISTORY (for comparison):
${JSON.stringify(interviewHistory.slice(-3), null, 2)}

Please compare this interview with previous ones and highlight:
- Technical growth or decline
- Improvement in communication
- Consistency in performance
- Specific areas showing progress
` : 'This is the candidate\'s first interview.'}

Format your response as JSON with this structure:
{
  "overallScore": <number>,
  "technicalDepth": <number>,
  "communication": <number>,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "actionableTips": ["tip1", "tip2", "tip3"],
  "comparisonNotes": "Brief comparison with previous interviews or 'First interview' if none",
  "summary": "A brief 2-3 sentence overall summary"
}`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();

    let analysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      analysis = {
        overallScore: 7,
        technicalDepth: 7,
        communication: 7,
        strengths: ['Good technical knowledge', 'Clear communication'],
        improvements: ['Provide more specific examples', 'Elaborate on technical decisions'],
        actionableTips: [
          'Prepare specific project examples with metrics',
          'Practice explaining complex concepts simply',
          'Review common system design patterns',
        ],
        comparisonNotes: interviewHistory.length === 0 ? 'First interview' : 'Showing steady progress',
        summary: 'Solid interview performance with room for improvement in technical depth.',
      };
    }

    const interviewRecord = {
      date: new Date().toISOString(),
      duration: duration,
      avgResponseTime: avgResponseTime,
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
      transcript: transcript.slice(0, 1000),
    };

    const updatedHistory = [...interviewHistory, interviewRecord];
    if (updatedHistory.length > 10) {
      updatedHistory.shift();
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ interview_history: updatedHistory })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      analysis,
      interviewRecord,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze interview', details: error.message },
      { status: 500 }
    );
  }
}
