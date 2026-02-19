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
    <div className="space-y-6 pb-20">
      {/* SECTION 1 — STREAK & MOTIVATION (Always Visible) */}
      <div className="pt-2">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 shadow-lg">
          <div className="p-8 space-y-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                <Flame className="w-10 h-10 text-orange-500" />
              </div>
              <div className="flex items-baseline gap-3 justify-center">
                <span className="text-7xl font-bold text-slate-900">
                  {streak}
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {streak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-900 leading-relaxed">
              You've shown up for <strong>{streak}</strong> {streak === 1 ? 'day' : 'days'}
            </p>
            <p className="text-lg font-medium text-slate-900 italic leading-relaxed">
              {motivationalMessage}
            </p>
          </div>
        </Card>
      </div>

      {/* SECTION 2 — UPCOMING DARE (If dare not live yet) */}
      {!isDareLive && !loading && (
        <div>
          <Card className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-lg text-slate-700 dark:text-slate-300 font-medium">Next dare in</span>
              </div>
              
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Perfect time to reflect on what you learned today.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* SECTION 3 — TODAY'S DARE (If dare is live) */}
      {isDareLive && !loading && (
        <div>
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="p-6 space-y-4">
              <div>
                <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                  DAY {todaysDare.day} DARE
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold leading-tight text-slate-900 dark:text-white">
                  {todaysDare.text}
                </h2>

                {todaysDare.explanation && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 border-l-4 border-indigo-500">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Why this?</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
        <div>
          {!hasSubmitted ? (
            <div className="space-y-4">
              <h3 className="text-base font-medium text-slate-900 dark:text-white">How will you respond?</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Text Submission */}
                <button
                  onClick={() => handleSubmissionClick('text')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                    <Type className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Text</span>
                </button>

                {/* Audio Submission */}
                <button
                  onClick={() => handleSubmissionClick('audio')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                    <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Audio</span>
                </button>

                {/* Video Submission */}
                <button
                  onClick={() => handleSubmissionClick('video')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors border-2 border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-md">
                    <Video className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Video</span>
                </button>

                {/* Photo Submission */}
                <button
                  onClick={() => handleSubmissionClick('photo')}
                  disabled={!isDareLive}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors border-2 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                    <ImageIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo</span>
                </button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-900 dark:text-yellow-200">
                  💡 <strong>Note:</strong> You can submit only once. Choose your format wisely.
                </p>
              </div>
            </div>
          ) : (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="p-6 text-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full mx-auto">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-green-900 dark:text-green-200">
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
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3 mb-4">
            <h3 className="text-base font-medium text-slate-900 dark:text-white">Community</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Glimpses from others who showed up today
            </p>
          </div>
          <CommunitySubmissions />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mx-auto"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mx-auto"></div>
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