'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WebcamPreview } from '@/components/WebcamPreview';
import { AudioWaveform } from '@/components/AudioWaveform';
import { PacingIndicator } from '@/components/PacingIndicator';
import { Video, Mic, Send, Loader2, StopCircle, Volume2, AlertCircle } from 'lucide-react';

export default function InterviewPage() {
  const router = useRouter();
  
  // States
  const [messages, setMessages] = useState<any[]>([]);
  const [displayText, setDisplayText] = useState(''); // What user sees
  const [isListening, setIsListening] = useState(false);
  const [sending, setSending] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');

  // Refs for logic (prevents stale closures)
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef(''); 
  const lastQuestionTimeRef = useRef(Date.now());
  const [lastResponseTime, setLastResponseTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  useEffect(() => {
    setupInterview();
    return () => {
      recognitionRef.current?.stop();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const setupInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).WebkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        setError("Speech Recognition not supported in this browser.");
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
        if (event.error === 'network') {
          console.error("Speech Network Error - Restarting...");
          if (isListening) setTimeout(() => recognition.start(), 1000);
        }
      };

      recognition.onend = () => {
        if (isListening) recognition.start();
      };

      recognitionRef.current = recognition;

      // Media Setup
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(media);

      // Start Interview
      setMessages([{ role: 'assistant', content: "Hello. I'm ready to begin. Please describe your experience with the technologies mentioned in your resume." }]);
    } catch (err) {
      setError("Please allow Camera and Microphone access.");
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSend = async () => {
    const finalInput = transcriptRef.current.trim();
    
    if (!finalInput || sending) return;

    setSending(true);
    setError('');

    // Stop mic if it's still running
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
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
    
    // Clear for next round
    transcriptRef.current = '';
    setDisplayText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      lastQuestionTimeRef.current = Date.now();
    } catch (err: any) {
      setError("AI failed to respond. Please try again.");
      // Put text back if it failed
      setDisplayText(finalInput);
      transcriptRef.current = finalInput;
    } finally {
      setSending(false);
    }
  };

  const [loading, setLoading] = useState(true);
  if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col overflow-hidden font-sans">
      <nav className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-tight">
          <Video className="w-5 h-5" /> 
          <span>DOMAIN EXPERT INTERVIEW</span>
        </div>
        <Button variant="destructive" size="sm" onClick={() => router.push('/dashboard')}>
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
                <div className={`p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 ${sending ? 'animate-pulse' : ''}`}>
                  <Volume2 className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <h2 className="text-2xl md:text-4xl font-light text-center leading-relaxed text-slate-100 italic">
                {messages[messages.length - 1]?.role === 'assistant' 
                  ? `"${messages[messages.length - 1].content}"` 
                  : "Synthesizing next question..."}
              </h2>
            </div>

            {/* User Interaction Zone */}
            <div className="pt-8 space-y-6">
              <div className="min-h-[60px] p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                {isListening ? (
                  <p className="text-cyan-400 animate-pulse font-mono text-sm">
                    ● LISTENING: {displayText || "..."}
                  </p>
                ) : (
                  <p className="text-slate-500 font-mono text-sm">
                    {displayText ? "TRANSCRIPTION READY" : "CLICK MIC TO START SPEAKING"}
                  </p>
                )}
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
            
            {error && (
              <div className="flex items-center gap-2 justify-center text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="hidden lg:flex col-span-4 border-l border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 flex-col space-y-8">
          <div className="space-y-4">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Candidate Monitor</h3>
             <div className="rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-2xl">
               <WebcamPreview stream={stream} />
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