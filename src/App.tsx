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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-2 text-slate-900 dark:text-white">DARE</h1>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Logo/Header */}
          <div className="px-6 py-8 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">DARE</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              A quiet space in a noisy phone
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6">
            <button
              onClick={() => setCurrentTab('home')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                currentTab === 'home'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>

            <button
              onClick={() => setCurrentTab('friends')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                currentTab === 'friends'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Friends</span>
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                currentTab === 'profile'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
          </nav>

          {/* Admin Settings at Bottom */}
          {isAdmin && (
            <div className="px-4 pb-6 border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                onClick={() => setShowAdmin(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-600"
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