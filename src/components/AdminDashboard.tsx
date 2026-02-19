import { useState, useEffect, useMemo } from 'react';
import { X, Plus, BarChart3, Users, Calendar, Clock, Send, AlertCircle, Copy, Share2, QrCode, Link2, Trash2, LogOut, Info, Filter, ChevronRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { admin, dares } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
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
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'rooms' | 'dares' | 'stats'>('rooms');
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

  // Modal States
  const [modalState, setModalState] = useState<{
    type: 'createRoom' | 'createDare' | 'share' | null;
    data?: any;
  }>({ type: null });

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
      const storedRoomsData = storedRooms ? JSON.parse(storedRooms) : [];
      
      // Show demo stats
      const mockStats = {
        totalParticipants: storedRoomsData.length * 5, // Demo: 5 participants per room
        completionRate: 75, // Demo: 75% completion rate
        avgStreak: 12, // Demo: 12 day average streak
        dailyParticipation: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          count: Math.floor(Math.random() * 20) + 10 // Random 10-30 participants per day
        })),
        streakDistribution: [
          { range: '1-3 days', count: 8 },
          { range: '4-7 days', count: 12 },
          { range: '8-14 days', count: 15 },
          { range: '15-30 days', count: 5 },
          { range: '30+ days', count: 2 },
        ]
      };
      
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
      loadAdminData();
      
      toast.success('Room created successfully!');
      setModalState({ type: 'share', data: newRoom });
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
      setModalState({ type: null });
      loadDares(selectedRoom);
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

  const activeRoomData = useMemo(() => 
    rooms.find(r => r.id === selectedRoom), [rooms, selectedRoom]
  );

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-slate-900 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gradient-to-r dark:from-cyan-600 dark:to-cyan-700 px-6 py-4 flex items-center justify-between border-b border-slate-300 dark:border-transparent shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-50 dark:bg-white/20 p-2 rounded-lg">
            <BarChart3 className="w-6 h-6 text-cyan-600 dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white">DARE Admin</h1>
            <p className="text-xs text-slate-600 dark:text-cyan-100 mt-1">Manage challenges & track community growth</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 gap-2" 
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
          </Button>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-700 dark:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-20 md:w-64 bg-white dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 flex flex-col shadow-sm">
          <nav className="flex-1 p-4 space-y-2">
            <NavButton 
              active={activeTab === 'rooms'} 
              onClick={() => setActiveTab('rooms')} 
              icon={<Calendar className="w-5 h-5" />} 
              label="Rooms" 
            />
            <NavButton 
              active={activeTab === 'dares'} 
              onClick={() => setActiveTab('dares')} 
              icon={<Send className="w-5 h-5" />} 
              label="Dares" 
            />
            <NavButton 
              active={activeTab === 'stats'} 
              onClick={() => setActiveTab('stats')} 
              icon={<Users className="w-5 h-5" />} 
              label="Analytics" 
            />
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'rooms' && (
              <RoomsSection 
                rooms={rooms} 
                loading={loading}
                onCreateClick={() => setModalState({ type: 'createRoom' })}
                onShare={(room: RoomData) => setModalState({ type: 'share', data: room })}
                onDelete={(id: string) => handleDeleteRoom(id)}
              />
            )}
            
            {activeTab === 'dares' && (
              <DaresSection 
                rooms={rooms}
                selectedRoomId={selectedRoom}
                dares={dares}
                onSelectRoom={(id: string) => {
                  setSelectedRoom(id);
                  loadDares(id);
                }}
                onCreateDare={() => setModalState({ type: 'createDare' })}
              />
            )}

            {activeTab === 'stats' && <StatsSection rooms={rooms} stats={stats} />}
          </div>
        </main>
      </div>

      {/* Dynamic Modals */}
      {modalState.type === 'createRoom' && (
        <CreateRoomModal 
          onClose={() => setModalState({ type: null })} 
          onSubmit={handleCreateRoom}
        />
      )}
      {modalState.type === 'share' && modalState.data && (
        <ShareRoomModal room={modalState.data} onClose={() => setModalState({ type: null })} />
      )}
      {modalState.type === 'createDare' && selectedRoom && (
        <CreateDareModal 
          selectedRoom={selectedRoom}
          onClose={() => setModalState({ type: null })} 
          onSubmit={handleCreateDare}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 font-semibold' 
          : 'text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

interface RoomsSectionProps {
  rooms: RoomData[];
  loading: boolean;
  onCreateClick: () => void;
  onShare: (room: RoomData) => void;
  onDelete: (id: string) => void;
}

function RoomsSection({ rooms, loading, onCreateClick, onShare, onDelete }: RoomsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Rooms</h2>
          <p className="text-slate-700 dark:text-slate-400">You have {rooms.length} active spaces</p>
        </div>
        <Button 
          onClick={onCreateClick} 
          className="bg-slate-700 hover:bg-slate-800 active:bg-slate-900 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:active:bg-cyan-800 h-12 px-6 rounded-xl shadow-md hover:shadow-lg gap-2 font-semibold transition-all text-white"
          style={{ backgroundColor: '#334155', color: '#ffffff' }}
        >
          <Plus className="w-5 h-5" /> Create New Room
        </Button>
      </div>

      {rooms.length === 0 && !loading ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
          <div className="bg-cyan-50 dark:bg-cyan-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-600">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-1 text-slate-900 dark:text-white">No rooms yet</h3>
          <p className="text-slate-700 dark:text-slate-400 mb-6">Start by creating a space for your participants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rooms.map((room: RoomData) => (
            <Card key={room.id} className="p-0 overflow-hidden bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-cyan-400 transition-colors shadow-sm hover:shadow-md">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    room.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {room.status}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onShare(room)}><Share2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => onDelete(room.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{room.name}</h3>
                <p className="text-sm text-slate-700 dark:text-slate-400 line-clamp-2 mb-6">{room.description || 'No description provided.'}</p>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-300 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-cyan-500" /> {room.dareDropTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-cyan-500" /> {room.duration} Days
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface DaresSectionProps {
  rooms: RoomData[];
  selectedRoomId: string | null;
  dares: DareData[];
  onSelectRoom: (id: string) => void;
  onCreateDare: () => void;
}

function DaresSection({ rooms, selectedRoomId, dares, onSelectRoom, onCreateDare }: DaresSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700">
        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Select Room to Manage Dares</label>
        <div className="flex gap-4">
          <select 
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 h-12 focus:ring-2 ring-cyan-500 outline-none text-slate-900 dark:text-white shadow-sm"
            value={selectedRoomId || ''}
            onChange={(e) => onSelectRoom(e.target.value)}
          >
            <option value="">Select a room...</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <Button 
            disabled={!selectedRoomId} 
            onClick={onCreateDare} 
            className="h-12 rounded-xl text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Dare
          </Button>
        </div>
      </div>

      {!selectedRoomId ? (
        <div className="text-center py-20 opacity-50">
          <Info className="w-12 h-12 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
          <p className="text-slate-700 dark:text-slate-400">Select a room above to view and schedule dares.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-500 uppercase tracking-widest">Scheduled Challenges</p>
          {dares.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
              <p className="text-slate-700 dark:text-slate-400">No dares published for this room yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {dares.map((dare) => (
                <Card key={dare.id} className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
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
                      <p className="text-sm text-slate-700 dark:text-slate-400 italic">
                        {dare.explanation}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatsSectionProps {
  rooms: RoomData[];
  stats: {
    totalParticipants: number;
    completionRate: number;
    avgStreak: number;
    dailyParticipation: { day: number; count: number }[];
    streakDistribution: { range: string; count: number }[];
  };
}

function StatsSection({ rooms, stats }: StatsSectionProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Participants" value={stats.totalParticipants.toString()} icon={<Users className="w-6 h-6" />} color="blue" />
        <StatCard label="Avg. Completion" value={`${stats.completionRate}%`} icon={<BarChart3 className="w-6 h-6" />} color="green" />
        <StatCard label="Avg Streak" value={`${stats.avgStreak} days`} icon={<Clock className="w-6 h-6" />} color="purple" />
      </div>
      
      <Card className="p-6 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <Filter className="w-4 h-4" /> Daily Participation (Last Week)
        </h3>
        <div className="h-64 flex items-end gap-2 px-2">
          {stats.dailyParticipation.map((item, i) => {
            const height = Math.min((item.count / 30) * 100, 100);
            return (
              <div key={i} className="flex-1 bg-cyan-500 rounded-t-lg transition-all hover:bg-cyan-600 group relative" style={{ height: `${height}%` }}>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-xs text-slate-600 dark:text-slate-400 font-medium px-2">
          {stats.dailyParticipation.map((item, i) => (
            <span key={i}>D{item.day}</span>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Streak Distribution</h3>
        <div className="space-y-3">
          {stats.streakDistribution.map((item) => {
            const width = Math.min((item.count / 20) * 100, 100);
            return (
              <div key={item.range} className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-400 w-24">
                  {item.range}
                </span>
                <div className="flex-1 bg-slate-300 dark:bg-slate-700 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-purple-500 dark:bg-purple-600 h-full flex items-center justify-end pr-3"
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-xs font-medium text-white">{item.count} users</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    purple: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
  };
  return (
    <Card className="p-6 flex items-center gap-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </Card>
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
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 shadow-2xl border border-slate-300 dark:border-slate-700">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
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
              </div>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-800">
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  ℹ️ After creation, you can:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5 ml-4">
                  <li>• Add dares with text and explanations</li>
                  <li>• Share room link and QR code</li>
                  <li>• View anonymous participation analytics</li>
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
                className="flex-1 text-white font-semibold"
              >
                {submitting ? 'Creating...' : 'CREATE ROOM'}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 shadow-2xl border border-slate-300 dark:border-slate-700">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
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

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-800">
              <div className="p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">⚠️ Admin Restriction:</p>
                  <p>Once published, dares <strong>cannot be edited or deleted</strong>.</p>
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
                className="flex-1 gap-2 text-white font-semibold"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Publishing...' : 'PUBLISH DARE'}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-300 dark:border-slate-700">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
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
          <div className="flex justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-inner">
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
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm"
              />
              <Button onClick={handleCopyLink} className="gap-2 text-white font-semibold">
                <Copy className="w-4 h-4" />
                COPY
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
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-800">
            <div className="p-4 flex gap-3">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  How to share
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
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