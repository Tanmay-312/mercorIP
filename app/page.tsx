'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { parseResume } from '@/lib/resume-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, Video, LogOut, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FIX: Use correct Supabase JS v2+ client methods for auth user/signout ----
  // Note: Type assertions added to bypass stale TypeScript type缓存
  const checkUser = async () => {
    try {
      // Use getUser() for high-integrity checks in Next.js 16
      const { data: { user: loggedInUser }, error } = await supabase.auth.getUser();
      
      if (error || !loggedInUser) {
        console.error('Auth check failed:', error);
        router.push('/login');
        return;
      }

      setUser(loggedInUser);

      // Fetch Profile - Ensure you are using 'maybeSingle' to avoid 406 errors
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loggedInUser.id)
        .maybeSingle();

      setProfile(profileData);
    } catch (err: any) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await (supabase.auth as any).signOut();
    router.push('/login');
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    setError('');

    try {
      const resumeData = await parseResume(file);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          skills: resumeData.skills,
          projects: resumeData.projects,
          resume_metadata: {
            ...resumeData.metadata,
            resumeText: resumeData.text,
          },
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await checkUser();
      alert('Resume uploaded successfully! You can now start your interview.');
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const hasResume = profile?.resume_metadata?.resumeText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Video className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Interview Platform</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">Hello, {profile?.full_name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white">
              AI-Powered Technical Interview
            </h2>
            <p className="text-xl text-slate-400">
              Upload your resume and let our AI interviewer assess your expertise
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="w-5 h-5 mr-2 text-cyan-400" />
                Upload Resume
              </CardTitle>
              <CardDescription className="text-slate-400">
                Supported formats: PDF, JSON, TXT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
                    <p className="text-slate-300">Processing your resume...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileText className="w-16 h-16 mx-auto text-slate-500" />
                    <div>
                      <p className="text-lg text-slate-300 mb-2">
                        Drag and drop your resume here, or
                      </p>
                      <label htmlFor="file-upload">
                        <Button
                          type="button"
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Browse Files
                        </Button>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.json,.txt"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {hasResume && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-green-400 font-semibold">Resume uploaded</p>
                        <p className="text-sm text-slate-400">
                          {profile.skills?.length || 0} skills detected
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/interview')}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      Start Interview
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {profile?.skills && profile.skills.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Detected Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
