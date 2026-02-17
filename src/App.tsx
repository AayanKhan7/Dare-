import { useState, useEffect } from 'react';
import { Home as HomeIcon, Users, User, Settings } from 'lucide-react';
import { Home } from './components/Home';
import { Friends } from './components/Friends';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, isAdmin, isReady, login, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<'home' | 'friends' | 'profile'>('home');
  const [showAdmin, setShowAdmin] = useState(false);

  // Auto-show admin dashboard for admin users
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setShowAdmin(true);
    }
  }, [isAuthenticated, isAdmin]);

  // Wait for auth to be ready before rendering
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-light mb-2 text-slate-800 dark:text-white">DARE</h1>
          <p className="text-slate-600 dark:text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  if (showAdmin && isAdmin) {
    return <AdminDashboard onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Logo/Header */}
          <div className="px-6 py-8">
            <h1 className="text-3xl font-light tracking-wide text-slate-800 dark:text-white">DARE</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              A quiet space in a noisy phone
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4">
            <button
              onClick={() => setCurrentTab('home')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                currentTab === 'home'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>

            <button
              onClick={() => setCurrentTab('friends')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                currentTab === 'friends'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Friends</span>
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                currentTab === 'profile'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
          </nav>

          {/* Admin Settings at Bottom */}
          {isAdmin && (
            <div className="px-4 pb-6">
              <button
                onClick={() => setShowAdmin(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-300 dark:border-slate-600"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
            {currentTab === 'home' && <Home />}
            {currentTab === 'friends' && <Friends />}
            {currentTab === 'profile' && <Profile />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}