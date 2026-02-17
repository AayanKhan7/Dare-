import { useState } from 'react';
import { Mail, Lock, User as UserIcon, Building2 } from 'lucide-react';
import { auth } from '../utils/api';

interface AuthProps {
  onLogin: (isAdmin: boolean) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check for admin credentials first (bypass Supabase for demo)
      const isAdminEmail = email.toLowerCase() === 'admin@dare.com' || email.toLowerCase().includes('@admin.');
      
      if (isAdminEmail && !isSignUp) {
        // Admin login - bypass Supabase authentication
        if (password === 'admin123') {
          // Store admin session in localStorage for demo
          localStorage.setItem('dare_admin_session', JSON.stringify({
            email: email.toLowerCase(),
            isAdmin: true,
            timestamp: new Date().toISOString()
          }));
          onLogin(true);
          return;
        } else {
          throw new Error('Invalid admin password');
        }
      }

      // Regular user authentication through Supabase
      if (isSignUp) {
        // Validate required fields
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        if (!phone.trim()) {
          throw new Error('Phone number is required');
        }
        await auth.signUp(email, password, name, organization, phone);
      } else {
        await auth.signIn(email, password);
      }
      
      onLogin(false);
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Provide helpful error messages
      let errorMessage = err.message || 'Authentication failed';
      
      if (errorMessage.includes('Invalid admin password')) {
        errorMessage = 'Invalid admin password. Please use: admin123';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage.includes('Account created but sign-in failed')) {
        errorMessage = 'Account created successfully! Please sign in with your credentials.';
        setIsSignUp(false); // Switch to login form
        setPassword(''); // Clear password for security
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
        setIsSignUp(false); // Switch to login form
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md my-8">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 mx-auto bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">D</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">DARE</h1>
          <p className="text-base text-slate-600 dark:text-slate-400">A quiet space in a noisy phone</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-4">
            💡 Admin Login: admin@dare.com / admin123
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-8 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 px-4 rounded-md font-semibold transition-colors ${
                !isSignUp
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 px-4 rounded-md font-semibold transition-colors ${
                isSignUp
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Organization / College (Optional)
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    placeholder="Company or school"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  backgroundColor: '#6366f1',
                  color: '#ffffff !important',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: '1.5'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                <span style={{ color: '#ffffff', display: 'block', visibility: 'visible' }}>
                  {loading ? 'LOADING...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
          One dare a day. One step forward.
        </p>
      </div>
    </div>
  );
}