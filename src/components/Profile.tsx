import { useState, useEffect } from 'react';
import { Flame, Trophy, Calendar, Bell, Settings, LogOut, Edit2, Share2, Info } from 'lucide-react';
import { user } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysShownUp: number;
  submissionCount?: number;
}

const PHILOSOPHY = `DARE is designed to help you show up for yourself. 

No likes, no comments, no competition. 

Just you, a challenge, and the strength that comes from consistency.

Every day you show up, you're proving to yourself that you can be trusted.`;

export function Profile() {
  const { logout, user: currentUser } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysShownUp: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    dareReminder: true,
    dareDropNotification: true,
    completionConfirmation: true,
    streakWarning: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const statsData = await user.getStats();
      setStats({
        currentStreak: statsData.currentStreak || 0,
        longestStreak: statsData.longestStreak || 0,
        totalDaysShownUp: statsData.totalDaysShownUp || 0,
        submissionCount: statsData.submissionCount || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.reload();
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Sign out failed');
    }
  };

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    // TODO: Call API to save notification settings
  };

  // Generate participation heatmap for 12 weeks
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Mock: 70% completion rate for past days
      const completionChance = Math.random();
      const status = i === 0 ? 1 : completionChance > 0.3 ? 1 : 0; // Today is always completed for demo
      data.push({ date, status });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Group heatmap into weeks
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const getHeatmapColor = (status: number) => {
    if (status === 1) return 'bg-green-500 dark:bg-green-600';
    if (status === 0) return 'bg-slate-200 dark:bg-slate-700';
    return 'bg-slate-100 dark:bg-slate-800';
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">Profile</h2>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Your DARE journey</p>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      {/* Stats Grid */}
      {!loading && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Current Streak */}
          <Card className="bg-gradient-to-br from-orange-400 to-red-500 border-0 shadow-xl shadow-orange-500/30">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white drop-shadow">
                  Current Streak
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-5xl font-black text-white drop-shadow-lg">
                  {stats.currentStreak}
                </p>
                <p className="text-sm text-white/90 font-medium">consecutive days</p>
              </div>
            </div>
          </Card>

          {/* Longest Streak */}
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 border-0 shadow-xl shadow-yellow-500/30">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white drop-shadow">
                  Best Streak
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-5xl font-black text-white drop-shadow-lg">
                  {stats.longestStreak}
                </p>
                <p className="text-sm text-white/90 font-medium">personal record</p>
              </div>
            </div>
          </Card>

          {/* Total Days */}
          <Card className="bg-gradient-to-br from-green-400 to-emerald-500 border-0 shadow-xl shadow-green-500/30">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white drop-shadow">
                  Total Days
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-5xl font-black text-white drop-shadow-lg">
                  {stats.totalDaysShownUp}
                </p>
                <p className="text-sm text-white/90 font-medium">dares completed</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Activity Heatmap */}
      {!loading && (
        <Card className="border-slate-200 dark:border-slate-700">
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">
              12-Week Activity
            </h3>

            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        title={day.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                        className={`w-3 h-3 rounded-sm transition-all hover:scale-125 cursor-help ${getHeatmapColor(day.status)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-sm"></div>
                <span className="text-slate-600 dark:text-slate-400">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                <span className="text-slate-600 dark:text-slate-400">Missed</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Why DARE Section */}
      <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="p-6 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-slate-800 dark:text-white mb-2">Why DARE</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {PHILOSOPHY}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Settings Section */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notifications
          </h3>

          <div className="space-y-3">
            {/* Dare Reminder */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white">Dare Reminder</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">30 minutes before dare drops</p>
              </div>
              <Switch
                checked={notificationSettings.dareReminder}
                onCheckedChange={() => handleNotificationChange('dareReminder')}
              />
            </div>

            {/* Dare Drop Notification */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white">Dare Drop</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">When a new dare is live</p>
              </div>
              <Switch
                checked={notificationSettings.dareDropNotification}
                onCheckedChange={() => handleNotificationChange('dareDropNotification')}
              />
            </div>

            {/* Completion Confirmation */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white">Completion</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">When you submit a response</p>
              </div>
              <Switch
                checked={notificationSettings.completionConfirmation}
                onCheckedChange={() => handleNotificationChange('completionConfirmation')}
              />
            </div>

            {/* Streak Warning */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white">Streak Warning</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Before your streak ends</p>
              </div>
              <Switch
                checked={notificationSettings.streakWarning}
                onCheckedChange={() => handleNotificationChange('streakWarning')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Account Section */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="p-6 space-y-3">
          <h4 className="font-medium text-slate-800 dark:text-white">Account</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="mb-1">
              <span className="text-slate-700 dark:text-slate-300">Email:</span> {currentUser?.email}
            </p>
            {currentUser?.user_metadata?.name && (
              <p>
                <span className="text-slate-700 dark:text-slate-300">Name:</span>{' '}
                {currentUser.user_metadata.name}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="border-slate-200 dark:border-slate-700">
          <div className="p-6 space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}