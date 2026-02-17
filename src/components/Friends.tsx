import { useState, useEffect } from 'react';
import { UserPlus, Check, X, Share2, MessageCircle, Copy, Flame, Clock, Users, Link as LinkIcon, Mail } from 'lucide-react';
import { friends as friendsApi } from '../utils/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface Friend {
  id: string;
  name: string;
  organization?: string;
  currentStreak: number;
  completedToday: boolean;
}

export function Friends() {
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteTab, setInviteTab] = useState<'link' | 'contact'>('link');
  const [contactInput, setContactInput] = useState('');
  const [copying, setCopying] = useState(false);

  const inviteLink = 'https://dare.app/join/abc123';
  const inviteMessage = "I'm doing one small dare every day. Join me.";

  useEffect(() => {
    loadFriends();
  }, []);

  async function loadFriends() {
    try {
      setLoading(true);
      const data = await friendsApi.getList();
      setFriendsList(data || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
      setFriendsList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInvite() {
    if (!contactInput.trim()) {
      toast.error('Please enter a phone number or email');
      return;
    }

    try {
      await friendsApi.sendInvite(contactInput);
      toast.success('Invite sent!');
      setContactInput('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invite');
    }
  }

  async function handleCopyLink() {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied!');
    } catch {
      toast.error('Failed to copy link');
    } finally {
      setCopying(false);
    }
  }

  const handleShareWhatsApp = () => {
    const text = `${inviteMessage}\n\n${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = 'Join me on DARE';
    const body = `${inviteMessage}\n\nDownload DARE: ${inviteLink}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const completedCount = friendsList.filter((f) => f.completedToday).length;
  const completionPercentage = friendsList.length > 0 ? Math.round((completedCount / friendsList.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900/20 dark:to-purple-900/20 -z-10"></div>
      
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl opacity-30 animate-pulse"></div>
        <h2 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">Friends</h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
          Shared accountability, not comparison
        </p>
      </div>

      {/* Friends Summary */}
      {!loading && friendsList.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 border-0 shadow-2xl shadow-blue-500/30">
          <div className="p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {friendsList.length} {friendsList.length === 1 ? 'friend' : 'friends'} on DARE
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base text-white/90 font-semibold">
                  Who completed today's dare
                </span>
                <span className="text-xl font-bold text-white">
                  {completedCount}/{friendsList.length}
                </span>
              </div>
              <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-emerald-400 h-4 rounded-full transition-all shadow-lg"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Friends List Section */}
      {!loading && friendsList.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800 dark:text-white">Your Friends</h3>
          <div className="space-y-3">
            {friendsList.map((friend) => (
              <Card key={friend.id} className="border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                    {friend.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 dark:text-white truncate">
                      {friend.name}
                    </h4>
                    {friend.organization && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {friend.organization}
                      </p>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                        {friend.currentStreak}
                      </span>
                    </div>

                    {friend.completedToday ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">✔️ Shown up</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Not yet</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invite Friends Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800 dark:text-white">Invite Friends</h3>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setInviteTab('link')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors text-sm ${
              inviteTab === 'link'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Link
          </button>
          <button
            onClick={() => setInviteTab('contact')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors text-sm ${
              inviteTab === 'contact'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Contact
          </button>
        </div>

        {/* Share Link Tab */}
        {inviteTab === 'link' && (
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Default invite text:
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm italic text-slate-700 dark:text-slate-300">
                  "{inviteMessage}"
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleCopyLink}
                  disabled={copying}
                  className="w-full justify-center gap-2"
                  variant="default"
                >
                  <Copy className="w-4 h-4" />
                  {copying ? 'Copied!' : 'Copy Link'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleShareWhatsApp}
                    variant="outline"
                    className="justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>

                  <Button
                    onClick={handleShareEmail}
                    variant="outline"
                    className="justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Contact Tab */}
        {inviteTab === 'contact' && (
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Send an invite to a specific person
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Phone number or email"
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleSendInvite}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Send
                </Button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-500">
                They'll receive an invite to join you on DARE
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {!loading && friendsList.length === 0 && (
        <Card className="bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 text-center py-12">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-400 mb-1">
            No friends yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 px-4">
            Invite friends to see their progress and stay motivated together
          </p>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
          <div className="p-6 space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
          </div>
        </Card>
      )}
    </div>
  );
}