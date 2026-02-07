'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WebcamPreview } from '@/components/WebcamPreview';
import { AudioWaveform } from '@/components/AudioWaveform';
import { PacingIndicator } from '@/components/PacingIndicator';
import { Video, Mic, MicOff, Send, Loader2, Home, StopCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function InterviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [interviewStartTime, setInterviewStartTime] = useState<number>(Date.now());
  const [lastResponseTime, setLastResponseTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    initializeInterview();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileData?.resume_metadata?.resumeText) {
        router.push('/');
        return;
      }

      setProfile(profileData);
      await startWebcam();

      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Hello! I'm your AI technical interviewer. I've reviewed your resume and I'm impressed with your background in ${profileData.skills?.slice(0, 3).join(', ')}. Let's start with a brief introduction - tell me about your most recent project and the technical challenges you faced.`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
      setInterviewStartTime(Date.now());
      lastMessageTimeRef.current = Date.now();
    } catch (err: any) {
      setError('Failed to initialize interview. Please try again.');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setIsRecording(true);
    } catch (err: any) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Webcam error:', err);
    }
  };

  const toggleMicrophone = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsRecording(!isRecording);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const currentTime = Date.now();
    const responseTime = (currentTime - lastMessageTimeRef.current) / 1000;
    setLastResponseTime(responseTime);
    setResponseTimes((prev) => [...prev, responseTime]);

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          resumeData: {
            skills: profile.skills,
            projects: profile.projects,
          },
          interviewHistory: profile.interview_history || [],
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      lastMessageTimeRef.current = Date.now();
    } catch (err: any) {
      setError('Failed to send message. Please try again.');
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const endInterview = async () => {
    if (!user || !profile) return;

    try {
      const interviewDuration = (Date.now() - interviewStartTime) / 1000 / 60;
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const transcript = messages
        .map((msg) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
        .join('\n\n');

      const response = await fetch('/api/analyze-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          transcript,
          duration: interviewDuration,
          avgResponseTime,
          interviewHistory: profile.interview_history || [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('End interview error:', err);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Video className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Live Interview</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={endInterview}
              className="bg-red-600 hover:bg-red-700"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Your Video</CardTitle>
              </CardHeader>
              <CardContent>
                <WebcamPreview stream={stream} />
                <div className="mt-4">
                  <Button
                    onClick={toggleMicrophone}
                    variant={isRecording ? 'default' : 'destructive'}
                    className="w-full"
                  >
                    {isRecording ? (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Microphone On
                      </>
                    ) : (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Microphone Off
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Audio Level</CardTitle>
              </CardHeader>
              <CardContent>
                <AudioWaveform stream={stream} isActive={isRecording} />
              </CardContent>
            </Card>

            <PacingIndicator
              lastResponseTime={lastResponseTime}
              averageResponseTime={averageResponseTime}
            />
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Interview Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your response..."
                    disabled={sending}
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
