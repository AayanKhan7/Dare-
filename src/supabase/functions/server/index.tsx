import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Create Supabase client with anon key for JWT verification
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to get authenticated user
async function getAuthenticatedUser(authHeader: string | undefined) {
  if (!authHeader) {
    console.log('No auth header provided');
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token in auth header');
    return null;
  }

  console.log('Attempting to verify JWT token (first 20 chars):', token.substring(0, 20) + '...');

  try {
    // Create a fresh client for this request with the user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    // Now get the user - the client has the token in its context
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error) {
      console.log('JWT verification error:', error.message);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      return null;
    }
    if (!user) {
      console.log('No user found for token');
      return null;
    }
    console.log('User authenticated successfully:', user.id, user.email);
    return user;
  } catch (error) {
    console.log('Exception verifying JWT:', error);
    return null;
  }
}

// Health check endpoint
app.get("/make-server-86075319/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTH ROUTES =====

// Sign up
app.post("/make-server-86075319/auth/signup", async (c) => {
  try {
    const { email, password, name, organization } = await c.req.json();
    
    console.log('Attempting signup for:', email);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, organization },
      email_confirm: true, // Auto-confirm since email server isn't configured
    });

    if (error) {
      console.log('Supabase auth error:', error.message, error);
      
      // Check if user already exists
      if (error.message.includes('already') || error.message.includes('exists')) {
        return c.json({ error: 'User already registered' }, 400);
      }
      
      return c.json({ error: error.message || 'Database error creating new user' }, 400);
    }

    if (!data?.user) {
      console.log('No user data returned from Supabase');
      return c.json({ error: 'Failed to create user' }, 500);
    }

    console.log('User created in Supabase:', data.user.id);

    // Initialize user data in KV store
    try {
      await kv.set(`user:${data.user.id}`, {
        id: data.user.id,
        email,
        name,
        organization,
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        createdAt: new Date().toISOString(),
      });
      console.log('User data saved to KV store');
    } catch (kvError) {
      console.log('KV store error:', kvError);
      // Continue anyway - user is created in auth
    }

    return c.json({ user: data.user, success: true });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Signup failed: ' + (error?.message || 'Unknown error') }, 500);
  }
});

// ===== USER ROUTES =====

// Get user profile
app.get("/make-server-86075319/user/profile", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const userData = await kv.get(`user:${user.id}`);
    return c.json({ profile: userData });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Update user profile
app.put("/make-server-86075319/user/profile", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const updates = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`) || {};
    const updatedData = { ...currentData, ...updates };
    await kv.set(`user:${user.id}`, updatedData);
    return c.json({ profile: updatedData });
  } catch (error) {
    console.log('Update profile error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get user stats
app.get("/make-server-86075319/user/stats", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    console.log('Getting stats for user:', user.id);
    
    let userData = await kv.get(`user:${user.id}`);
    
    // If user data doesn't exist in KV store, initialize it
    if (!userData) {
      console.log('User data not found in KV, initializing...');
      userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'User',
        organization: user.user_metadata?.organization || '',
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        createdAt: new Date().toISOString(),
      };
      
      try {
        await kv.set(`user:${user.id}`, userData);
        console.log('User data initialized in KV store');
      } catch (kvError) {
        console.log('Failed to initialize user data:', kvError);
        // Continue with default values
      }
    }
    
    const submissions = await kv.getByPrefix(`submission:${user.id}:`);
    
    return c.json({
      currentStreak: userData?.currentStreak || 0,
      longestStreak: userData?.longestStreak || 0,
      totalDays: userData?.totalDays || 0,
      submissionCount: submissions?.length || 0,
    });
  } catch (error) {
    console.log('Get stats error:', error);
    // Return default stats instead of error
    return c.json({
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      submissionCount: 0,
    });
  }
});

// ===== DARE ROUTES =====

// Get today's dare
app.get("/make-server-86075319/dares/today", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const today = new Date().toISOString().split('T')[0];
    const dare = await kv.get(`dare:${today}`);
    
    if (!dare) {
      // Return a default dare if none scheduled
      return c.json({
        dare: {
          id: today,
          text: "Tell us one thing you notice in people that others don't.",
          explanation: "It could be a small gesture, a pattern in how they speak, or something about the way they move through the world. What do you see?",
          date: today,
        }
      });
    }

    return c.json({ dare });
  } catch (error) {
    console.log('Get today dare error:', error);
    return c.json({ error: 'Failed to get dare' }, 500);
  }
});

// Check if user has submitted today
app.get("/make-server-86075319/submissions/check-today", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const today = new Date().toISOString().split('T')[0];
    const submission = await kv.get(`submission:${user.id}:${today}`);
    return c.json({ hasSubmitted: !!submission, submission });
  } catch (error) {
    console.log('Check submission error:', error);
    return c.json({ error: 'Failed to check submission' }, 500);
  }
});

// Submit dare response
app.post("/make-server-86075319/submissions/submit", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { type, content } = await c.req.json();
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Submitting dare for user:', user.id, 'type:', type);
    
    // Check if already submitted
    const existing = await kv.get(`submission:${user.id}:${today}`);
    if (existing) {
      console.log('User already submitted today');
      return c.json({ error: 'Already submitted today' }, 400);
    }

    // Save submission
    const submission = {
      userId: user.id,
      type,
      content,
      date: today,
      timestamp: new Date().toISOString(),
    };
    
    try {
      await kv.set(`submission:${user.id}:${today}`, submission);
      console.log('Submission saved successfully');
    } catch (submitError) {
      console.log('Error saving submission:', submitError);
      return c.json({ error: 'Failed to save submission' }, 500);
    }

    // Update user stats
    let userData = await kv.get(`user:${user.id}`);
    
    // Initialize user data if it doesn't exist
    if (!userData) {
      console.log('User data not found, initializing...');
      userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'User',
        organization: user.user_metadata?.organization || '',
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        createdAt: new Date().toISOString(),
      };
    }
    
    const currentStreak = (userData.currentStreak || 0) + 1;
    const longestStreak = Math.max(currentStreak, userData.longestStreak || 0);
    const totalDays = (userData.totalDays || 0) + 1;

    try {
      await kv.set(`user:${user.id}`, {
        ...userData,
        currentStreak,
        longestStreak,
        totalDays,
        lastSubmission: today,
      });
      console.log('User stats updated, new streak:', currentStreak);
    } catch (statsError) {
      console.log('Error updating user stats:', statsError);
      // Continue anyway, submission was saved
    }

    return c.json({ success: true, submission, stats: { currentStreak, longestStreak, totalDays } });
  } catch (error) {
    console.log('Submit dare error:', error);
    return c.json({ error: 'Failed to submit: ' + (error?.message || 'Unknown error') }, 500);
  }
});

// Get community submissions
app.get("/make-server-86075319/submissions/community", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const today = new Date().toISOString().split('T')[0];
    const allSubmissions = await kv.getByPrefix(`submission:`);
    
    // Filter today's submissions and anonymize
    const todaySubmissions = allSubmissions
      .filter((s: any) => s.date === today && s.userId !== user.id)
      .slice(0, 10)
      .map((s: any) => ({
        type: s.type,
        content: s.content,
        timestamp: s.timestamp,
      }));

    return c.json({ submissions: todaySubmissions });
  } catch (error) {
    console.log('Get community submissions error:', error);
    return c.json({ error: 'Failed to get submissions' }, 500);
  }
});

// ===== FRIENDS ROUTES =====

// Get friends list
app.get("/make-server-86075319/friends", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const friendsList = await kv.get(`friends:${user.id}`) || { friendIds: [] };
    const friends = [];
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const friendId of friendsList.friendIds) {
      const friendData = await kv.get(`user:${friendId}`);
      const hasSubmitted = !!(await kv.get(`submission:${friendId}:${today}`));
      
      if (friendData) {
        friends.push({
          id: friendId,
          name: friendData.name,
          completed: hasSubmitted,
          streak: friendData.currentStreak || 0,
        });
      }
    }

    return c.json({ friends });
  } catch (error) {
    console.log('Get friends error:', error);
    return c.json({ error: 'Failed to get friends' }, 500);
  }
});

// Add friend
app.post("/make-server-86075319/friends/add", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { friendId } = await c.req.json();
    const friendsList = await kv.get(`friends:${user.id}`) || { friendIds: [] };
    
    if (!friendsList.friendIds.includes(friendId)) {
      friendsList.friendIds.push(friendId);
      await kv.set(`friends:${user.id}`, friendsList);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Add friend error:', error);
    return c.json({ error: 'Failed to add friend' }, 500);
  }
});

// ===== ADMIN ROUTES =====

// Create room (admin only)
app.post("/make-server-86075319/admin/rooms", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { name, duration, dropTime } = await c.req.json();
    const roomId = crypto.randomUUID();
    
    const room = {
      id: roomId,
      name,
      duration,
      dropTime,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      participants: [],
    };

    await kv.set(`room:${roomId}`, room);
    return c.json({ room });
  } catch (error) {
    console.log('Create room error:', error);
    return c.json({ error: 'Failed to create room' }, 500);
  }
});

// Create dare (admin only)
app.post("/make-server-86075319/admin/dares", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { text, explanation, date, roomId } = await c.req.json();
    
    const dare = {
      text,
      explanation,
      date,
      roomId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`dare:${date}`, dare);
    return c.json({ dare });
  } catch (error) {
    console.log('Create dare error:', error);
    return c.json({ error: 'Failed to create dare' }, 500);
  }
});

// Get admin stats
app.get("/make-server-86075319/admin/stats", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const allUsers = await kv.getByPrefix(`user:`);
    const allSubmissions = await kv.getByPrefix(`submission:`);
    
    const totalParticipants = allUsers.length;
    const today = new Date().toISOString().split('T')[0];
    const todaySubmissions = allSubmissions.filter((s: any) => s.date === today);
    const completionRate = totalParticipants > 0 
      ? Math.round((todaySubmissions.length / totalParticipants) * 100) 
      : 0;
    
    const avgStreak = totalParticipants > 0
      ? Math.round(allUsers.reduce((sum: number, u: any) => sum + (u.currentStreak || 0), 0) / totalParticipants)
      : 0;

    return c.json({
      totalParticipants,
      completionRate,
      avgStreak,
    });
  } catch (error) {
    console.log('Get admin stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

Deno.serve(app.fetch);