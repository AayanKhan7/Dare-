import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isReady: boolean;
  user: any | null;
  login: (isAdminUser: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      console.log('🔍 Checking session...');
      
      // Check for admin session first (localStorage-based for demo)
      const adminSessionStr = localStorage.getItem('dare_admin_session');
      if (adminSessionStr) {
        try {
          const adminSession = JSON.parse(adminSessionStr);
          console.log('✅ Admin session found:', adminSession.email);
          setUser({ email: adminSession.email, isAdmin: true });
          setIsAuthenticated(true);
          setIsAdmin(true);
          setIsReady(true);
          return;
        } catch (e) {
          console.error('❌ Admin session parse error:', e);
          localStorage.removeItem('dare_admin_session');
        }
      }
      
      // Check regular Supabase session
      const session = await auth.getSession();
      
      if (session?.user) {
        console.log('✅ Session found for:', session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);
        const adminCheck = session.user.email?.includes('admin') || false;
        setIsAdmin(adminCheck);
      } else {
        console.log('❌ No active session');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Session check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      // Mark as ready only after session check completes
      setIsReady(true);
      console.log('✅ Auth context ready');
    }
  }

  const login = async (isAdminUser: boolean) => {
    setIsAdmin(isAdminUser);
    
    if (isAdminUser) {
      // For admin, directly update state (localStorage already set in Auth.tsx)
      await checkSession();
    } else {
      // For regular users, wait a bit for Supabase session to be established
      await new Promise(resolve => setTimeout(resolve, 800));
      await checkSession();
    }
  };

  const logout = async () => {
    try {
      // Clear admin session if exists
      localStorage.removeItem('dare_admin_session');
      
      // Sign out from Supabase if regular user
      await auth.signOut();
      
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isAdmin, 
        isReady,
        user,
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
