'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleProgress as Progress } from '@/components/SimpleProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Home,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Lightbulb,
  Loader2,
  Award,
} from 'lucide-react';

interface InterviewRecord {
  date: string;
  duration: number;
  avgResponseTime: number;
  scores: {
    overall: number;
    technical: number;
    communication: number;
  };
  strengths: string[];
  improvements: string[];
  actionableTips: string[];
  comparisonNotes: string;
  summary: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewRecord[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // 1. Use the standard getUser (it's async)
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log("No user found, redirecting...");
        router.push('/login');
        return;
      }

      // 2. Fetch profile data
      // Note: Use 'interview_history' (snake_case) to match Postgres convention
      const { data: profileData, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (dbError) throw dbError;

      setProfile(profileData);
      
      // Handle the case where interview_history might be null
      setInterviewHistory(profileData?.interview_history || []);
      
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const latestInterview = interviewHistory[interviewHistory.length - 1];
  const averageScores = interviewHistory.length > 0
    ? {
        overall: interviewHistory.reduce((sum, i) => sum + i.scores.overall, 0) / interviewHistory.length,
        technical: interviewHistory.reduce((sum, i) => sum + i.scores.technical, 0) / interviewHistory.length,
        communication: interviewHistory.reduce((sum, i) => sum + i.scores.communication, 0) / interviewHistory.length,
      }
    : { overall: 0, technical: 0, communication: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Performance Dashboard</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {profile?.full_name}!</h2>
          <p className="text-slate-400">
            {interviewHistory.length === 0
              ? 'Start your first interview to track your progress'
              : `You've completed ${interviewHistory.length} interview${interviewHistory.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {interviewHistory.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Award className="w-16 h-16 mx-auto text-slate-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No interviews yet</h3>
              <p className="text-slate-400 mb-6">Complete your first interview to see your progress here</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Start Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400">Overall Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold text-cyan-400">
                      {averageScores.overall.toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-lg mb-1">/10</span>
                  </div>
                  <Progress value={averageScores.overall * 10} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400">Technical Depth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold text-blue-400">
                      {averageScores.technical.toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-lg mb-1">/10</span>
                  </div>
                  <Progress value={averageScores.technical * 10} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400">Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold text-green-400">
                      {averageScores.communication.toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-lg mb-1">/10</span>
                  </div>
                  <Progress value={averageScores.communication * 10} className="mt-3" />
                </CardContent>
              </Card>
            </div>

            {latestInterview && (
              <Card className="bg-slate-800/50 border-slate-700 mb-8">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                    Latest Interview Summary
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {new Date(latestInterview.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300">{latestInterview.summary}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-400 text-sm">
                        Duration: {latestInterview.duration.toFixed(1)} minutes
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-400 text-sm">
                        Avg Response: {latestInterview.avgResponseTime.toFixed(1)}s
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400 mb-2">
                      <span className="font-semibold text-cyan-400">Progress Notes:</span>{' '}
                      {latestInterview.comparisonNotes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="tips" className="space-y-6">
              <TabsList className="bg-slate-800/50 border border-slate-700">
                <TabsTrigger value="tips" className="data-[state=active]:bg-slate-700">
                  Actionable Tips
                </TabsTrigger>
                <TabsTrigger value="strengths" className="data-[state=active]:bg-slate-700">
                  Strengths
                </TabsTrigger>
                <TabsTrigger value="improvements" className="data-[state=active]:bg-slate-700">
                  Improvements
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-slate-700">
                  History
                </TabsTrigger>
              </TabsList>

              {latestInterview && (
                <>
                  <TabsContent value="tips">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                          Tips for Your Next Interview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {latestInterview.actionableTips.map((tip, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 text-sm font-semibold">
                                {index + 1}
                              </span>
                              <span className="text-slate-300">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="strengths">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white">Key Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {latestInterview.strengths.map((strength, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              <span className="text-slate-300">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="improvements">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white">Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {latestInterview.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                              <span className="text-slate-300">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}

              <TabsContent value="history">
                <div className="space-y-4">
                  {interviewHistory.slice().reverse().map((interview, index) => (
                    <Card key={index} className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white text-lg">
                              Interview #{interviewHistory.length - index}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(interview.date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-cyan-400">
                              {interview.scores.overall}
                              <span className="text-sm text-slate-500">/10</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Technical</p>
                            <Progress value={interview.scores.technical * 10} />
                            <p className="text-sm text-slate-400 mt-1">
                              {interview.scores.technical}/10
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Communication</p>
                            <Progress value={interview.scores.communication * 10} />
                            <p className="text-sm text-slate-400 mt-1">
                              {interview.scores.communication}/10
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mt-4">{interview.summary}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
