'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const WebcamPreview = dynamic(
  () => import('@/components/WebcamPreview').then((mod) => mod.WebcamPreview),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-900 border-2 border-slate-700 rounded-lg flex items-center justify-center"><p className="text-slate-500">Loading camera...</p></div> }
);
import { AudioWaveform } from '@/components/AudioWaveform';
import { PacingIndicator } from '@/components/PacingIndicator';
import { Video, Mic, Send, Loader2, StopCircle, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InterviewPage() {
  const router = useRouter();
  
  // States
  const [messages, setMessages] = useState<any[]>([]);
  const [displayText, setDisplayText] = useState(''); // What user sees
  const [isListening, setIsListening] = useState(false);
  const [sending, setSending] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Audio synthesis helper
  const speakMsg = (text: string) => {
    if (!isAudioEnabled || typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    
    synth.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  };

  // Refs for logic (prevents stale closures)
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const transcriptRef = useRef(''); 
  const lastQuestionTimeRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());
  const fullTranscriptRef = useRef('');
  
  // Facial Analytics Ref
  const emotionHistoryRef = useRef<any[]>([]);

  const handleEmotionUpdate = (emotions: any) => {
    emotionHistoryRef.current.push(emotions);
  };

  const [lastResponseTime, setLastResponseTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  useEffect(() => {
    setupInterview();
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).WebkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Speech Recognition not supported in this browser.");
        setLoading(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        // Update both Ref (for logic) and State (for UI)
        transcriptRef.current = current;
        setDisplayText(current);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone access.");
          setIsListening(false);
          isListeningRef.current = false;
        } else if (event.error === 'network') {
          toast.error("Speech recognition network error. This browser may not support the API. Click the mic to try again.");
          setIsListening(false);
          isListeningRef.current = false;
        }
        // no-speech errors are ignored and rely on onend to restart
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try { setTimeout(() => recognition.start(), 250); } catch(e) {}
        }
      };

      recognitionRef.current = recognition;

      // Media Setup
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(media);

      // Start Interview
      const initialMessage = "Hello. I'm ready to begin. Please describe your experience with the technologies mentioned in your resume.";
      setMessages([{ role: 'assistant', content: initialMessage }]);
      fullTranscriptRef.current += `Interviewer: ${initialMessage}\n`;
      // Don't auto-speak initial message here as it sometimes violates autoplay policies on fast navigation, wait for user input.
    } catch (err) {
      toast.error("Please allow Camera and Microphone access.");
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      try { recognitionRef.current?.start(); } catch(e) {}
    }
  };

  const handleSend = async () => {
    const finalInput = transcriptRef.current.trim();
    
    if (!finalInput || sending) return;

    setSending(true);


    // Stop mic if it's still running
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      isListeningRef.current = false;
    }

    // Pacing metrics
    const now = Date.now();
    const diff = (now - lastQuestionTimeRef.current) / 1000;
    setLastResponseTime(diff);
    setResponseTimes(prev => [...prev, diff]);

    // Update UI locally
    const userMsg = { role: 'user', content: finalInput };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    fullTranscriptRef.current += `Candidate: ${finalInput}\n`;
    
    // Clear for next round
    transcriptRef.current = '';
    setDisplayText('');

    try {
      const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           messages: updatedMessages,
           resumeContext: profile?.resume_metadata?.resumeText || "No resume provided.",
           detectedSkills: profile?.skills || [],
           elapsedMinutes,
           interviewSettings: profile?.resume_metadata?.interview_settings || null,
           resumeChunks: profile?.resume_metadata?.chunks || null
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      fullTranscriptRef.current += `Interviewer: ${data.message}\n`;
      lastQuestionTimeRef.current = Date.now();
      speakMsg(data.message);
    } catch (err: any) {
      toast.error("AI failed to respond. Please try again.");
      // Put text back if it failed
      setDisplayText(finalInput);
      transcriptRef.current = finalInput;
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = async () => {
    if (isEnding) return;
    setIsEnding(true);


    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      if (stream) stream.getTracks().forEach(t => t.stop());

      const durationMinutes = (Date.now() - startTimeRef.current) / 60000;
      const avgResponse = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

      // Calculate averaged facial expressions
      let avgEmotions = null;
      if (emotionHistoryRef.current.length > 0) {
         const summary: any = {};
         emotionHistoryRef.current.forEach(e => {
            Object.keys(e).forEach(k => {
               summary[k] = (summary[k] || 0) + e[k];
            });
         });
         Object.keys(summary).forEach(k => {
            summary[k] = Number((summary[k] / emotionHistoryRef.current.length).toFixed(4));
         });
         avgEmotions = summary;
      }

      const res = await fetch('/api/analyze-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          transcript: fullTranscriptRef.current,
          duration: durationMinutes,
          avgResponseTime: avgResponse,
          interviewHistory: profile?.interview_history || [],
          facialEmotions: avgEmotions
        }),
      });

      if (!res.ok) throw new Error("Failed to load interview analysis from server.");
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.analysis) {
        const interviewRecord = {
          date: new Date().toISOString(),
          duration: Number(durationMinutes.toFixed(2)),
          avgResponseTime: Number(avgResponse.toFixed(2)),
          scores: {
            overall: data.analysis.overallScore,
            technical: data.analysis.technicalDepth,
            communication: data.analysis.communication,
          },
          strengths: data.analysis.strengths,
          improvements: data.analysis.improvements,
          actionableTips: data.analysis.actionableTips,
          comparisonNotes: data.analysis.comparisonNotes,
          summary: data.analysis.summary,
          transcript: fullTranscriptRef.current.slice(0, 2000), 
        };

        const updatedHistory = [...(profile?.interview_history || []), interviewRecord].slice(-10);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ interview_history: updatedHistory })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      }

      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || "Failed to end session cleanly");
      setIsEnding(false);
    }
  };

  if (loading || isEnding) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col space-y-4 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        {isEnding && <p className="text-cyan-400 font-mono text-sm animate-pulse">Analyzing interview...</p>}
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col overflow-hidden font-sans">
      <nav className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-tight">
          <Video className="w-5 h-5" /> 
          <span>DOMAIN EXPERT INTERVIEW</span>
        </div>
        <Button variant="destructive" size="sm" onClick={handleEndSession} disabled={isEnding}>
          <StopCircle className="w-4 h-4 mr-2" /> End Session
        </Button>
      </nav>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Interview Focus Area */}
        <div className="col-span-12 lg:col-span-8 p-6 md:p-12 flex flex-col justify-center relative bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="max-w-3xl mx-auto w-full space-y-12">
            
            {/* AI Question Display */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <button 
                  onClick={() => {
                    setIsAudioEnabled(!isAudioEnabled);
                    if (isAudioEnabled) window.speechSynthesis?.cancel();
                  }}
                  title={isAudioEnabled ? "Mute AI Voice" : "Enable AI Voice"}
                  className={`p-3 rounded-full border transition-all ${
                    isAudioEnabled 
                      ? 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400' 
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-500'
                  } ${sending && isAudioEnabled ? 'animate-pulse' : ''}`}
                >
                  {isAudioEnabled ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
                </button>
              </div>
              <h2 className="text-2xl md:text-4xl font-light text-center leading-relaxed text-slate-100 italic">
                {messages[messages.length - 1]?.role === 'assistant' 
                  ? `"${messages[messages.length - 1].content}"` 
                  : "Synthesizing next question..."}
              </h2>
            </div>

            {/* User Interaction Zone */}
            <div className="pt-8 space-y-6">
              <div className="min-h-[60px] p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center relative">
                {isListening ? (
                  <p className="text-cyan-400 animate-pulse font-mono text-sm mb-2 w-full text-center">
                    ● LISTENING: {displayText || "..."}
                  </p>
                ) : (
                  <p className="text-slate-500 font-mono text-sm mb-2 w-full text-center">
                    {displayText ? "TRANSCRIPTION READY" : "CLICK MIC OR TYPE BELOW"}
                  </p>
                )}
                
                {/* Fallback Text Input */}
                <textarea
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 font-sans mt-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none resize-none transition-all"
                  rows={3}
                  placeholder="Type your answer here if microphone is unavailable..."
                  value={displayText}
                  onChange={(e) => {
                     setDisplayText(e.target.value);
                     transcriptRef.current = e.target.value;
                  }}
                  disabled={isListening || sending}
                />
              </div>

              <div className="flex justify-center gap-8 items-center">
                <button
                  onClick={handleMicToggle}
                  title={isListening ? "Stop Microphone" : "Start Microphone"}
                  className={`p-8 rounded-full transition-all transform hover:scale-105 active:scale-95 z-50 ${
                    isListening ? 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]' : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <Mic className={`w-10 h-10 ${isListening ? 'text-white' : 'text-slate-400'}`} />
                </button>
                
                <button
                  onClick={handleSend}
                  title="Send Response"
                  disabled={!displayText.trim() || sending}
                  className="p-8 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-10 disabled:grayscale transition-all transform hover:scale-105 active:scale-95 z-50 shadow-[0_0_20px_rgba(8,145,178,0.3)]"
                >
                  {sending ? <Loader2 className="w-10 h-10 animate-spin" /> : <Send className="w-10 h-10" />}
                </button>
              </div>
            </div>
            
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="hidden lg:flex col-span-4 border-l border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 flex-col space-y-8">
          <div className="space-y-4">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Candidate Monitor</h3>
             <div className="rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-2xl relative">
               <WebcamPreview stream={stream} onEmotionUpdate={handleEmotionUpdate} />
               <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded border border-white/10 backdrop-blur-md">
                 <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                 <span className="text-[8px] font-mono text-cyan-400">TRACKING</span>
               </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Vocal Presence</h3>
              <AudioWaveform stream={stream} isActive={isListening} />
            </div>

            <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Cognitive Load</h3>
              <PacingIndicator 
                lastResponseTime={lastResponseTime} 
                averageResponseTime={responseTimes.length > 0 ? responseTimes.reduce((a,b)=>a+b,0)/responseTimes.length : 0} 
              />
            </div>
          </div>
          
          <div className="mt-auto p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <p className="text-[10px] text-cyan-400 font-bold uppercase mb-1">Domain Context</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI is currently cross-referencing your vocal responses with the projects detected in your PDF metadata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}