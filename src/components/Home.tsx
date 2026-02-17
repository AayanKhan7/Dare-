import { useState, useEffect } from 'react';
import { Flame, Clock, Check, Type, Mic, Video, Image as ImageIcon, Share2, Lightbulb } from 'lucide-react';
import { user, dares, submissions } from '../utils/api';
import { SubmissionModal } from './SubmissionModal';
import { CommunitySubmissions } from './CommunitySubmissions';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

const MOTIVATIONAL_MESSAGES = [
  "You kept your promise to yourself.",
  "Showing up is everything.",
  "One day at a time.",
  "Progress over perfection.",
  "You're building something beautiful.",
  "Consistency is your superpower.",
  "Keep going.",
  "You belong here.",
  "You kept your promise today.",
  "Every day you show up, you win.",
  "This is how trust is built — one day at a time.",
];

export function Home() {
  const { isReady, user: currentUser } = useAuth();
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionType, setSubmissionType] = useState<'text' | 'audio' | 'video' | 'photo' | null>(null);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todaysDare, setTodaysDare] = useState({
    id: '',
    text: '',
    explanation: '',
    day: 1,
  });
  const [isDareLive, setIsDareLive] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedContent, setSubmittedContent] = useState<{ type: string; content: string } | null>(null);

  // Set random motivational message on mount
  useEffect(() => {
    setMotivationalMessage(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
  }, []);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        loadData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load user stats
      try {
        const statsData = await user.getStats();
        setStreak(statsData.currentStreak || 0);
        setLongestStreak(statsData.longestStreak || 0);
      } catch (statsError) {
        console.error('Stats error:', statsError);
        setStreak(0);
        setLongestStreak(0);
      }

      // Load today's dare
      try {
        const dareData = await dares.getToday();
        const dare = dareData.dare;
        setTodaysDare({
          id: dare.id || '',
          text: dare.text || 'Tell us one thing you notice in people that others don\'t.',
          explanation: dare.explanation || 'Help yourself become more observant.',
          day: dare.day || 1,
        });
        setIsDareLive(true);
      } catch (dareError) {
        console.error('Dare error:', dareError);
        setIsDareLive(false);
      }

      // Check if already submitted
      try {
        const submissionCheck = await submissions.checkToday();
        setHasSubmitted(submissionCheck.hasSubmitted || false);
        if (submissionCheck.submittedContent) {
          setSubmittedContent(submissionCheck.submittedContent);
        }
      } catch (submissionError) {
        console.error('Submission check error:', submissionError);
        setHasSubmitted(false);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }

  // Countdown timer - only show if dare is not live
  useEffect(() => {
    if (isDareLive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          setIsDareLive(true);
          toast.success('Today\'s dare is now live! 🔥');
          return { hours: 0, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDareLive]);

  const handleSubmissionClick = (type: 'text' | 'audio' | 'video' | 'photo') => {
    if (!isDareLive) {
      toast.error('The dare is not live yet.');
      return;
    }
    setSubmissionType(type);
    setShowSubmissionModal(true);
  };

  const handleSubmit = async (content: string) => {
    try {
      setSubmitting(true);
      await submissions.submit(submissionType!, content);
      setHasSubmitted(true);
      setSubmittedContent({ type: submissionType!, content });
      setShowSubmissionModal(false);
      toast.success('✔️ You showed up today!');
      
      // Reload data to get updated streak
      await loadData();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-0 pb-20 relative">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-indigo-900/20 -z-10"></div>
      
      {/* SECTION 1 — STREAK & MOTIVATION (Always Visible) */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-orange-50 via-pink-50 to-transparent dark:from-slate-900 dark:via-purple-900/40 dark:to-transparent pt-6 pb-6 backdrop-blur-sm">
        <Card className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 border-0 shadow-2xl shadow-orange-500/30">
          <div className="p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Flame className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-7xl font-black text-white drop-shadow-2xl">
                  {streak}
                </span>
                <span className="text-2xl text-white/90 font-semibold">
                  {streak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
            <p className="text-xl text-white font-medium leading-relaxed drop-shadow">
              You've shown up for <strong className="font-black">{streak}</strong> {streak === 1 ? 'day' : 'days'}
            </p>
            <p className="text-lg text-white/90 italic font-light">
              {motivationalMessage}
            </p>
          </div>
        </Card>
      </div>

      {/* SECTION 2 — UPCOMING DARE (If dare not live yet) */}
      {!isDareLive && !loading && (
        <div className="my-8">
          <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 shadow-2xl shadow-purple-500/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
            <div className="p-10 text-center space-y-6 relative">
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl text-white font-semibold">Next dare in</span>
              </div>
              
              <div className="text-7xl font-black tracking-tight text-white font-mono drop-shadow-2xl">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
              
              <p className="text-base text-white/90 font-medium max-w-md mx-auto">
                Perfect time to reflect on what you learned today.
              </p>

              {/* Subtle pulse animation */}
              <div className="flex justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-lg"></div>
                <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-lg" style={{animationDelay: '0.5s'}}></div>
                <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-lg" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SECTION 3 — TODAY'S DARE (If dare is live) */}
      {isDareLive && !loading && (
        <div className="my-8">
          <Card className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 border-0 shadow-2xl shadow-cyan-500/30">
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="inline-block px-4 py-2 bg-white/30 backdrop-blur-sm text-white rounded-full text-sm font-bold shadow-lg">
                  DAY {todaysDare.day} DARE
                </div>
              </div>

              <div className="space-y-5">
                <h2 className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                  {todaysDare.text}
                </h2>

                {todaysDare.explanation && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/30 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-base font-bold text-white">Why this?</span>
                    </div>
                    <p className="text-base text-white/95 leading-relaxed font-medium">
                      {todaysDare.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SECTION 4 — MY SUBMISSION (Core Interaction) */}
      {isDareLive && !loading && (
        <div className="my-8">
          {!hasSubmitted ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800 dark:text-white">How will you respond?</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Text Submission */}
                <button
                  onClick={() => handleSubmissionClick('text')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Type className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Text</span>
                </button>

                {/* Audio Submission */}
                <button
                  onClick={() => handleSubmissionClick('audio')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Mic className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Audio</span>
                </button>

                {/* Video Submission */}
                <button
                  onClick={() => handleSubmissionClick('video')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Video className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Video</span>
                </button>

                {/* Photo Submission */}
                <button
                  onClick={() => handleSubmissionClick('photo')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <ImageIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Photo</span>
                </button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  💡 <strong>Note:</strong> You can submit only once. Choose your format wisely.
                </p>
              </div>
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
              <div className="p-8 text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-green-900 dark:text-green-200">
                    ✔️ You showed up today
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your submission has been recorded. Come back tomorrow for the next dare.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* SECTION 5 — COMMUNITY (Below submission) */}
      {!loading && (
        <div className="my-8 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">Community</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Glimpses from others who showed up today
            </p>
          </div>
          <CommunitySubmissions />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="my-8 text-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2 mx-auto"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && submissionType && (
        <SubmissionModal
          type={submissionType}
          onClose={() => setShowSubmissionModal(false)}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}