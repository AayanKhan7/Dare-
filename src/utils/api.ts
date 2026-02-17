import { projectId, publicAnonKey } from './supabase/info';
import { createClient } from '@supabase/supabase-js';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-86075319`;

// Create Supabase client for auth
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  organization?: string;
  role: 'participant' | 'admin';
  currentStreak: number;
  longestStreak: number;
  totalDaysShownUp: number;
  createdAt: string;
}

export interface Dare {
  id: string;
  day: number;
  text: string;
  explanation: string;
  roomId: string;
}

export interface Submission {
  id: string;
  userId: string;
  roomId: string;
  dareId: string;
  submissionDate: string;
  submissionType: 'text' | 'audio' | 'video' | 'photo';
  content?: string;
  fileUrl?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  adminId: string;
  name: string;
  description?: string;
  dareDropTime: string;
  duration: number;
  currentDay: number;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
}

// Helper to get auth header
async function getAuthHeader() {
  try {
    // Check for admin session first (localStorage-based for demo)
    const adminSessionStr = localStorage.getItem('dare_admin_session');
    if (adminSessionStr) {
      try {
        const adminSession = JSON.parse(adminSessionStr);
        console.log('✓ Admin token retrieved for:', adminSession.email);
        return 'Bearer admin_demo_token'; // Demo token for admin
      } catch (e) {
        console.error('Admin session parse error:', e);
        localStorage.removeItem('dare_admin_session');
      }
    }
    
    // Check regular Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return null;
    }
    
    if (!session?.access_token) {
      console.warn('No valid session found');
      return null;
    }
    
    console.log('✓ Auth token retrieved for user:', session.user?.email);
    return `Bearer ${session.access_token}`;
  } catch (err) {
    console.error('Exception getting auth header:', err);
    return null;
  }
}

// Helper for API calls
async function apiCall(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    requireAuth?: boolean;
  } = {}
) {
  const { method = 'GET', body, requireAuth = true } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      throw new Error('Not authenticated');
    }
    headers['Authorization'] = authHeader;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}


// Auth API
export const auth = {
  async signUp(email: string, password: string, name: string, organization?: string, phone?: string) {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name, organization, phone }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }
      
      // Wait a moment for the user to be fully created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now sign in with the credentials
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in after signup error:', error);
        throw new Error('Account created but sign-in failed. Please try logging in manually.');
      }
      return data;
    } catch (error) {
      console.error('Signup process error:', error);
      throw error;
    }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Get session error:', error);
    }
    return session;
  },

  async getCurrentUser() {
    const session = await this.getSession();
    if (!session) return null;
    return session.user;
  },
};

// User API
export const user = {
  async getProfile(): Promise<User> {
    try {
      return await apiCall('/user/profile');
    } catch (error) {
      // Demo mode fallback
      const session = await auth.getSession();
      return {
        id: 'demo_user',
        email: session?.user?.email || 'user@demo.com',
        name: session?.user?.user_metadata?.name || 'Demo User',
        role: 'participant',
        currentStreak: parseInt(localStorage.getItem('dare_demo_streak') || '3', 10),
        longestStreak: parseInt(localStorage.getItem('dare_demo_longest_streak') || '7', 10),
        totalDaysShownUp: parseInt(localStorage.getItem('dare_demo_total_days') || '15', 10),
        createdAt: new Date().toISOString(),
      };
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      return await apiCall('/user/profile', { method: 'PUT', body: updates });
    } catch (error) {
      return this.getProfile();
    }
  },

  async getStats() {
    try {
      return await apiCall('/user/stats');
    } catch (error) {
      // Demo mode fallback
      const currentStreak = parseInt(localStorage.getItem('dare_demo_streak') || '3', 10);
      const longestStreak = parseInt(localStorage.getItem('dare_demo_longest_streak') || '7', 10);
      const totalDaysShownUp = parseInt(localStorage.getItem('dare_demo_total_days') || '15', 10);
      
      return {
        currentStreak,
        longestStreak,
        totalDaysShownUp,
        submissionCount: totalDaysShownUp,
      };
    }
  },

  async getSubmissions(limit: number = 10) {
    try {
      return await apiCall(`/user/submissions?limit=${limit}`);
    } catch (error) {
      // Demo mode fallback
      return [];
    }
  },

  async getCalendarData() {
    try {
      return await apiCall('/user/calendar');
    } catch (error) {
      // Demo mode fallback
      return [];
    }
  },

  async getStreakInfo() {
    try {
      return await apiCall('/user/streak');
    } catch (error) {
      // Demo mode fallback
      return {
        currentStreak: parseInt(localStorage.getItem('dare_demo_streak') || '3', 10),
        longestStreak: parseInt(localStorage.getItem('dare_demo_longest_streak') || '7', 10),
      };
    }
  },
};

// Dare API
export const dares = {
  async getToday(): Promise<{ dare: Dare; timeLeft?: string }> {
    try {
      return await apiCall('/dares/today');
    } catch (error) {
      // Demo mode fallback
      const demoDay = parseInt(localStorage.getItem('dare_demo_current_day') || '3', 10);
      return {
        dare: {
          id: `demo_dare_${demoDay}`,
          day: demoDay,
          text: "What made your day better today?",
          explanation: "It helps you notice small wins before the day ends.",
          roomId: 'demo_room',
        },
      };
    }
  },

  async getForRoom(roomId: string): Promise<Dare[]> {
    try {
      return await apiCall(`/dares/room/${roomId}`);
    } catch (error) {
      return [];
    }
  },

  async createDare(roomId: string, day: number, text: string, explanation: string): Promise<Dare> {
    try {
      return await apiCall('/dares/create', {
        method: 'POST',
        body: { roomId, day, text, explanation },
      });
    } catch (error) {
      throw error;
    }
  },
};

// Submission API
export const submissions = {
  async checkToday() {
    try {
      const result = await apiCall('/submissions/check-today');
      return result;
    } catch (error) {
      // Demo mode fallback
      const todayKey = new Date().toISOString().split('T')[0];
      const submitted = localStorage.getItem(`dare_demo_submission_${todayKey}`);
      
      if (submitted) {
        const data = JSON.parse(submitted);
        return {
          hasSubmitted: true,
          submittedContent: data,
        };
      }
      
      return { hasSubmitted: false };
    }
  },

  async submit(type: 'text' | 'audio' | 'video' | 'photo', content: string, fileUrl?: string): Promise<Submission> {
    try {
      return await apiCall('/submissions/submit', {
        method: 'POST',
        body: { type, content, fileUrl },
      });
    } catch (error) {
      // Demo mode fallback - store in localStorage
      const todayKey = new Date().toISOString().split('T')[0];
      const submission = {
        id: `demo_submission_${Date.now()}`,
        userId: 'demo_user',
        roomId: 'demo_room',
        dareId: `demo_dare_${localStorage.getItem('dare_demo_current_day') || '3'}`,
        submissionDate: new Date().toISOString(),
        submissionType: type,
        content,
        fileUrl,
        createdAt: new Date().toISOString(),
      };
      
      // Store submission
      localStorage.setItem(`dare_demo_submission_${todayKey}`, JSON.stringify({ type, content }));
      
      // Update streak
      const currentStreak = parseInt(localStorage.getItem('dare_demo_streak') || '3', 10);
      localStorage.setItem('dare_demo_streak', String(currentStreak + 1));
      
      const longestStreak = parseInt(localStorage.getItem('dare_demo_longest_streak') || '7', 10);
      if (currentStreak + 1 > longestStreak) {
        localStorage.setItem('dare_demo_longest_streak', String(currentStreak + 1));
      }
      
      const totalDays = parseInt(localStorage.getItem('dare_demo_total_days') || '15', 10);
      localStorage.setItem('dare_demo_total_days', String(totalDays + 1));
      
      return submission;
    }
  },

  async getCommunity(limit: number = 10): Promise<Submission[]> {
    try {
      return await apiCall(`/submissions/community?limit=${limit}`);
    } catch (error) {
      // Demo mode fallback - generate mock community submissions
      const mockSubmissions: Submission[] = [
        {
          id: '1',
          userId: 'anon1',
          roomId: 'demo_room',
          dareId: 'demo_dare_3',
          submissionDate: new Date().toISOString(),
          submissionType: 'text',
          content: 'A stranger smiled at me on the bus. Made me realize how rare genuine kindness is.',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'anon2',
          roomId: 'demo_room',
          dareId: 'demo_dare_3',
          submissionDate: new Date().toISOString(),
          submissionType: 'text',
          content: 'Finally tried that recipe I saved months ago. Cooking for myself felt like self-respect.',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          userId: 'anon3',
          roomId: 'demo_room',
          dareId: 'demo_dare_3',
          submissionDate: new Date().toISOString(),
          submissionType: 'text',
          content: 'Listened to birdsong during my morning walk. Been rushing past it for years.',
          createdAt: new Date().toISOString(),
        },
      ];
      
      return mockSubmissions.slice(0, limit);
    }
  },

  async getById(submissionId: string): Promise<Submission> {
    return apiCall(`/submissions/${submissionId}`);
  },

  async getForRoom(roomId: string, limit: number = 10): Promise<Submission[]> {
    return apiCall(`/submissions/room/${roomId}?limit=${limit}`);
  },
};

// Friends API
export const friends = {
  async getList() {
    try {
      return await apiCall('/friends');
    } catch (error) {
      // Demo mode fallback - generate mock friends
      return [
        {
          id: 'friend1',
          name: 'Sarah Chen',
          organization: 'Stanford University',
          currentStreak: 12,
          completedToday: true,
        },
        {
          id: 'friend2',
          name: 'Alex Kumar',
          organization: 'MIT',
          currentStreak: 8,
          completedToday: false,
        },
        {
          id: 'friend3',
          name: 'Maya Patel',
          currentStreak: 15,
          completedToday: true,
        },
      ];
    }
  },

  async syncContacts(contacts: { name: string; phone: string }[]) {
    try {
      return await apiCall('/friends/sync', {
        method: 'POST',
        body: { contacts },
      });
    } catch (error) {
      return { synced: 0 };
    }
  },

  async getWhoHasCompletedToday() {
    try {
      return await apiCall('/friends/completed-today');
    } catch (error) {
      return [];
    }
  },

  async sendInvite(phoneOrEmail: string) {
    try {
      return await apiCall('/friends/invite', {
        method: 'POST',
        body: { phoneOrEmail },
      });
    } catch (error) {
      // Demo mode - just return success
      return { success: true };
    }
  },

  async getInviteLink() {
    try {
      return await apiCall('/friends/invite-link', {
        method: 'POST',
      });
    } catch (error) {
      return { link: 'https://dare.app/join/demo123' };
    }
  },
};

// Room API (Participant)
export const rooms = {
  async getMyRooms() {
    return apiCall('/rooms/my-rooms');
  },

  async getRoomById(roomId: string): Promise<Room> {
    return apiCall(`/rooms/${roomId}`);
  },

  async joinWithInviteCode(inviteCode: string) {
    return apiCall('/rooms/join', {
      method: 'POST',
      body: { inviteCode },
    });
  },

  async getParticipantCount(roomId: string) {
    return apiCall(`/rooms/${roomId}/participants-count`);
  },
};

// Admin API
export const admin = {
  async createRoom(name: string, description: string, duration: number, dareDropTime: string): Promise<Room> {
    return apiCall('/admin/rooms', {
      method: 'POST',
      body: { name, description, duration, dareDropTime },
    });
  },

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    return apiCall(`/admin/rooms/${roomId}`, {
      method: 'PUT',
      body: updates,
    });
  },

  async deleteRoom(roomId: string) {
    return apiCall(`/admin/rooms/${roomId}`, { method: 'DELETE' });
  },

  async getRooms(): Promise<Room[]> {
    try {
      return await apiCall('/admin/rooms');
    } catch (error) {
      console.error('Error getting rooms:', error);
      return [];
    }
  },

  async createDare(roomId: string, day: number, text: string, explanation: string): Promise<Dare> {
    return apiCall('/admin/dares', {
      method: 'POST',
      body: { roomId, day, text, explanation },
    });
  },

  async updateDare(dareId: string, updates: Partial<Dare>): Promise<Dare> {
    return apiCall(`/admin/dares/${dareId}`, {
      method: 'PUT',
      body: updates,
    });
  },

  async deleteDare(dareId: string) {
    return apiCall(`/admin/dares/${dareId}`, { method: 'DELETE' });
  },

  async getDares(roomId: string): Promise<Dare[]> {
    try {
      return await apiCall(`/admin/dares?roomId=${roomId}`);
    } catch (error) {
      console.error('Error getting dares:', error);
      return [];
    }
  },

  async getDareStats(roomId: string) {
    return apiCall(`/admin/stats/dares/${roomId}`);
  },

  async getParticipationStats(roomId: string) {
    return apiCall(`/admin/stats/participation/${roomId}`);
  },

  async getStreakDistribution(roomId: string) {
    return apiCall(`/admin/stats/streaks/${roomId}`);
  },

  async getRoomStats(roomId: string) {
    return apiCall(`/admin/rooms/${roomId}/stats`);
  },

  async generateInviteCode(roomId: string) {
    return apiCall(`/admin/rooms/${roomId}/invite-code`, { method: 'POST' });
  },

  async getStats() {
    try {
      return await apiCall('/admin/stats');
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        totalParticipants: 0,
        completionRate: 0,
        avgStreak: 0,
      };
    }
  },
};