import { useState, useEffect } from 'react';
import { X, Plus, BarChart3, Users, Calendar, Clock, Send, AlertCircle, Copy, Share2, QrCode, Link2, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { admin, dares } from '../utils/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface AdminDashboardProps {
  onClose: () => void;
}

interface RoomData {
  id: string;
  name: string;
  description?: string;
  dareDropTime: string;
  duration: number;
  currentDay: number;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
  inviteCode?: string;
  inviteLink?: string;
}

interface DareData {
  id: string;
  day: number;
  text: string;
  explanation: string;
  roomId: string;
  createdAt: string;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'rooms' | 'dares' | 'stats'>('rooms');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showCreateDare, setShowCreateDare] = useState(false);
  const [showRoomShare, setShowRoomShare] = useState<RoomData | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [dares, setDares] = useState<DareData[]>([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    completionRate: 0,
    avgStreak: 0,
    dailyParticipation: [] as { day: number; count: number }[],
    streakDistribution: [] as { range: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      setLoading(true);
      // Load from localStorage for demo purposes
      const storedRooms = localStorage.getItem('dare_admin_rooms');
      if (storedRooms) {
        setRooms(JSON.parse(storedRooms));
      }
      
      // Use mock stats for demo (in production, this would fetch from API)
      const mockStats = {
        totalParticipants: 0,
        completionRate: 0,
        avgStreak: 0
      };
      
      // If there are rooms, calculate some basic stats from localStorage
      const allParticipants = new Set();
      const storedRoomsData = storedRooms ? JSON.parse(storedRooms) : [];
      storedRoomsData.forEach((room: any) => {
        // In a real app, this would fetch actual participants
        // For demo, we'll show static data
      });
      
      // Show demo stats
      mockStats.totalParticipants = storedRoomsData.length * 5; // Demo: 5 participants per room
      mockStats.completionRate = 75; // Demo: 75% completion rate
      mockStats.avgStreak = 12; // Demo: 12 day average streak
      
      // Generate demo daily participation data (last 7 days)
      mockStats.dailyParticipation = Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        count: Math.floor(Math.random() * 20) + 10 // Random 10-30 participants per day
      }));
      
      // Generate demo streak distribution
      mockStats.streakDistribution = [
        { range: '1-3 days', count: 8 },
        { range: '4-7 days', count: 12 },
        { range: '8-14 days', count: 15 },
        { range: '15-30 days', count: 5 },
        { range: '30+ days', count: 2 },
      ];
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      // Set default stats on error
      setStats({ 
        totalParticipants: 0, 
        completionRate: 0, 
        avgStreak: 0,
        dailyParticipation: [],
        streakDistribution: [],
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadDares(roomId: string) {
    try {
      if (roomId) {
        // Load from localStorage for demo
        const storedDares = localStorage.getItem(`dare_room_${roomId}_dares`);
        if (storedDares) {
          setDares(JSON.parse(storedDares));
        } else {
          setDares([]);
        }
      }
    } catch (error) {
      console.error('Failed to load dares:', error);
      toast.error('Failed to load dares');
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateInviteLink = (inviteCode: string) => {
    return `${window.location.origin}/join/${inviteCode}`;
  };

  const handleCreateRoom = async (roomData: any) => {
    try {
      const inviteCode = generateInviteCode();
      const newRoom: RoomData = {
        id: `room_${Date.now()}`,
        name: roomData.name,
        description: roomData.description || '',
        dareDropTime: roomData.dareDropTime,
        duration: roomData.duration,
        currentDay: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        inviteCode,
        inviteLink: generateInviteLink(inviteCode),
      };
      
      // Save to localStorage for demo
      const updatedRooms = [...rooms, newRoom];
      setRooms(updatedRooms);
      localStorage.setItem('dare_admin_rooms', JSON.stringify(updatedRooms));
      
      toast.success('Room created successfully!');
      setShowCreateRoom(false);
      
      // Show share modal immediately
      setShowRoomShare(newRoom);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create room');
    }
  };

  const handleCreateDare = async (dareData: any) => {
    try {
      if (!selectedRoom) {
        toast.error('Please select a room');
        return;
      }
      
      const newDare: DareData = {
        id: `dare_${Date.now()}`,
        day: dareData.day,
        text: dareData.text,
        explanation: dareData.explanation || '',
        roomId: selectedRoom,
        createdAt: new Date().toISOString(),
      };
      
      // Save to localStorage for demo
      const updatedDares = [...dares, newDare];
      setDares(updatedDares);
      localStorage.setItem(`dare_room_${selectedRoom}_dares`, JSON.stringify(updatedDares));
      
      toast.success('Dare created successfully!');
      setShowCreateDare(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create dare');
    }
  };

  const handleCopyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard!');
  };

  const handleDeleteRoom = (roomId: string) => {
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    setRooms(updatedRooms);
    localStorage.setItem('dare_admin_rooms', JSON.stringify(updatedRooms));
    localStorage.removeItem(`dare_room_${roomId}_dares`);
    toast.success('Room deleted');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMTAgNjAgTSAwIDEwIEwgNjAgMTAgTSAyMCAwIEwgMjAgNjAgTSAwIDIwIEwgNjAgMjAgTSAzMCAwIEwgMzAgNjAgTSAwIDMwIEwgNjAgMzAgTSA0MCAwIEwgNDAgNjAgTSAwIDQwIEwgNjAgNDAgTSA1MCAwIEwgNTAgNjAgTSAwIDUwIEwgNjAgNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="max-w-6xl mx-auto min-h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm relative shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700 backdrop-blur-sm border-b border-white/20 px-6 py-6 flex items-center justify-between z-20 shadow-2xl shadow-purple-500/20">
          <div>
            <h1 className="text-4xl font-black text-white drop-shadow-lg">
              Admin Dashboard
            </h1>
            <p className="text-lg text-white/95 font-semibold drop-shadow">
              Host / Organizer Interface - Manage DARE Rooms for your community
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm hover:scale-110"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6">
          <div className="flex gap-2">
            {(['rooms', 'dares', 'stats'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'dares' && selectedRoom) loadDares(selectedRoom);
                }}
                className={`px-4 py-3 border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-slate-800 dark:text-white">
                  Your Rooms
                </h2>
                <Button
                  onClick={() => setShowCreateRoom(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Room
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-32 animate-pulse bg-slate-200 dark:bg-slate-700" />
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <Card className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-600 dark:text-slate-400">No rooms created yet</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {rooms.map((room) => (
                    <Card key={room.id} className="border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">
                              {room.name}
                            </h3>
                            {room.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                {room.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Drops at {room.dareDropTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {room.duration} days
                              </span>
                              <span>Day {room.currentDay} of {room.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            {room.status}
                          </div>
                        </div>
                        
                        {/* Room Actions */}
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <Button
                            onClick={() => setShowRoomShare(room)}
                            variant="outline"
                            className="gap-2 flex-1"
                          >
                            <Share2 className="w-4 h-4" />
                            Share Room
                          </Button>
                          <Button
                            onClick={() => room.inviteLink && handleCopyInviteLink(room.inviteLink)}
                            variant="outline"
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteRoom(room.id)}
                            variant="outline"
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dares' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Room
                  </label>
                  <select
                    value={selectedRoom || ''}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      loadDares(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Choose a room...</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => setShowCreateDare(true)}
                  disabled={!selectedRoom}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Dare
                </Button>
              </div>

              {selectedRoom && (
                <div className="space-y-3">
                  {dares.length === 0 ? (
                    <Card className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">No dares scheduled</p>
                    </Card>
                  ) : (
                    dares.map((dare) => (
                      <Card key={dare.id} className="border-slate-200 dark:border-slate-700 p-5">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium mb-2">
                                Day {dare.day}
                              </div>
                              <p className="text-slate-800 dark:text-white leading-relaxed">
                                {dare.text}
                              </p>
                            </div>
                          </div>
                          {dare.explanation && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                              {dare.explanation}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-xl font-light text-slate-800 dark:text-white">
                Aggregated Participation Statistics
              </h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                  <div className="p-6 space-y-3">
                    <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-3xl font-light text-slate-800 dark:text-white">
                        {stats.totalParticipants}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Total Participants
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <div className="p-6 space-y-3">
                    <BarChart3 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-3xl font-light text-slate-800 dark:text-white">
                        {stats.completionRate}%
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Overall Completion Rate
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                  <div className="p-6 space-y-3">
                    <Clock className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-3xl font-light text-slate-800 dark:text-white">
                        {stats.avgStreak}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Average Streak
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Daily Participation Chart */}
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-white">
                    Daily Participation Count (Last 7 Days)
                  </h3>
                  <div className="space-y-2">
                    {stats.dailyParticipation.map((item) => (
                      <div key={item.day} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-16">
                          Day {item.day}
                        </span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-8 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full flex items-center justify-end pr-3"
                            style={{ width: `${Math.min((item.count / 30) * 100, 100)}%` }}
                          >
                            <span className="text-xs font-medium text-white">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Streak Distribution */}
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-white">
                    Streak Distribution (Anonymous)
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Number of participants in each streak range
                  </p>
                  <div className="space-y-3">
                    {stats.streakDistribution.map((item) => (
                      <div key={item.range} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24">
                          {item.range}
                        </span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-8 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full flex items-center justify-end pr-3"
                            style={{ width: `${Math.min((item.count / 20) * 100, 100)}%` }}
                          >
                            <span className="text-xs font-medium text-white">{item.count} users</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Admin Restrictions Notice */}
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="p-5 space-y-3">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Admin Restrictions (Privacy-First Design)
                      </p>
                      <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                        <p>✗ Cannot view individual submissions</p>
                        <p>✗ Cannot edit dares after publishing</p>
                        <p>✗ Cannot rank or compare users</p>
                        <p className="pt-2 text-xs italic">All statistics are completely anonymous and aggregated to preserve participant trust.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateRoom && (
          <CreateRoomModal
            onClose={() => setShowCreateRoom(false)}
            onSubmit={handleCreateRoom}
          />
        )}

        {showCreateDare && selectedRoom && (
          <CreateDareModal
            onClose={() => setShowCreateDare(false)}
            onSubmit={handleCreateDare}
            selectedRoom={selectedRoom}
          />
        )}

        {showRoomShare && (
          <ShareRoomModal
            room={showRoomShare}
            onClose={() => setShowRoomShare(null)}
          />
        )}
      </div>
    </div>
  );
}

interface CreateRoomModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function CreateRoomModal({ onClose, onSubmit }: CreateRoomModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    dareDropTime: '19:00', // Default to 7 PM IST
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a room name');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-light text-slate-800 dark:text-white">
              Create New Room
            </h3>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Room Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Stanford University Fall 2024"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this room..."
                className="w-full h-20 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  disabled={submitting}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Dare Drop Time (IST)
                </label>
                <input
                  type="time"
                  value={formData.dareDropTime}
                  onChange={(e) => setFormData({ ...formData, dareDropTime: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  disabled={submitting}
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Default: 7 PM IST (19:00)
                </p>
              </div>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  ℹ️ After creation, you can:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5 ml-4">
                  <li>• Add dares with text and explanations</li>
                  <li>• Share room link and QR code</li>
                  <li>• View anonymous participation analytics</li>
                  <li>• Monitor daily participation counts</li>
                  <li>• See streak distribution (anonymous)</li>
                </ul>
              </div>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

interface CreateDareModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedRoom: string;
}

function CreateDareModal({ onClose, onSubmit, selectedRoom }: CreateDareModalProps) {
  const [formData, setFormData] = useState({
    day: 1,
    text: '',
    explanation: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      toast.error('Please enter dare text');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-light text-slate-800 dark:text-white">
              Create New Dare
            </h3>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Day Number
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Dare Text *
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="What's the question or challenge?"
                className="w-full h-24 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Explanation (optional)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Why this dare? What does it help with?"
                className="w-full h-20 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                disabled={submitting}
              />
            </div>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">⚠️ Admin Restriction:</p>
                  <p>Once published, dares <strong>cannot be edited or deleted</strong>. This preserves participant trust and ensures fairness.</p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Publishing...' : 'Publish Dare'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

interface ShareRoomModalProps {
  room: RoomData;
  onClose: () => void;
}

function ShareRoomModal({ room, onClose }: ShareRoomModalProps) {
  const inviteUrl = room.inviteLink || `${window.location.origin}/join/${room.inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard!');
  };

  const handleShareWhatsApp = () => {
    const text = `Join my DARE room "${room.name}"!\n\n${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Join my DARE room: ${room.name}`;
    const body = `I'd like to invite you to join my DARE room!\n\nRoom: ${room.name}\n${room.description ? `Description: ${room.description}\n` : ''}\nDuration: ${room.duration} days\nDaily dare drops at: ${room.dareDropTime}\n\nJoin here: ${inviteUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-light text-slate-800 dark:text-white">
              Share Room
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Room Info */}
          <div className="space-y-2">
            <h4 className="font-medium text-slate-800 dark:text-white">
              {room.name}
            </h4>
            {room.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {room.description}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700">
            <QRCodeSVG 
              value={inviteUrl} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Invite Link */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Invite Link
            </label>
            <div className="flex gap-2">
              <input
                value={inviteUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm"
              />
              <Button onClick={handleCopyLink} className="gap-2">
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                onClick={handleShareEmail}
                variant="outline"
                className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Link2 className="w-4 h-4" />
                Email
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="p-4 flex gap-3">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  How to share
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  Share the QR code or link with participants. They can scan the QR code or click the link to join your room.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}