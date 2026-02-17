# DARE App Setup Guide

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  role VARCHAR(50) DEFAULT 'participant', -- 'participant' | 'admin'
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_days_shown_up INT DEFAULT 0,
  last_submission_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### Rooms Table (For Admin to create dare rooms)
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dare_drop_time TIME NOT NULL, -- e.g., '09:00:00'
  duration INT NOT NULL, -- 7, 14, or 30 days
  current_day INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'inactive' | 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Room Participants Table
```sql
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);
```

### Dares Table
```sql
CREATE TABLE dares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  day INT NOT NULL, -- 1-30
  text VARCHAR(500) NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, day)
);
```

### Submissions Table
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  dare_id UUID NOT NULL REFERENCES dares(id),
  submission_date DATE NOT NULL,
  submission_type VARCHAR(50) NOT NULL, -- 'text' | 'audio' | 'video' | 'photo'
  content TEXT, -- for text submissions
  file_url VARCHAR(500), -- for media
  file_size INT, -- in bytes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, room_id, submission_date)
);
```

### Streaks Table (Backup for streak tracking)
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_submission_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invites Table
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

### Notification Settings
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  dare_drop_notification BOOLEAN DEFAULT TRUE,
  dare_reminder_notification BOOLEAN DEFAULT TRUE,
  streak_warning_notification BOOLEAN DEFAULT TRUE,
  completion_confirmation BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Row-Level Security (RLS) Policies

All tables should have appropriate RLS policies to ensure:
- Users can only see their own data
- Admins can see data for rooms they manage
- Submissions are anonymous when displayed as community submissions
- Auth is properly verified

## To Set Up:

1. Go to Supabase dashboard for your project
2. Create each table with the SQL provided
3. Enable RLS on all tables
4. Create policies for each table (examples below)
5. Enable Storage for media uploads

## API Endpoints Needed

### Auth Endpoints
- POST /auth/signup - Register new user
- POST /auth/signin - Sign in
- POST /auth/signout - Sign out
- GET /auth/me - Get current user

### User Endpoints
- GET /user/profile - Get user profile
- PUT /user/profile - Update profile
- GET /user/stats - Get streak and stats
- GET /user/submissions - Get user submissions
- GET /user/calendar - Get participation heatmap

### Dare Endpoints
- GET /dares/today - Get today's dare for user's room
- GET /dares/:room_id - Get all dares for a room
- POST /dares/:room_id - Create dare (admin only)

### Submission Endpoints
- POST /submissions - Submit for today's dare
- GET /submissions/today - Check if already submitted
- GET /submissions/community - Get random anonymous submissions
- GET /submissions/:id - Get single submission

### Room Endpoints (Admin)
- POST /rooms - Create new room
- GET /rooms - Get user's rooms (participant) or managed rooms (admin)
- PUT /rooms/:id - Update room (admin only)
- DELETE /rooms/:id - Delete room (admin only)
- POST /rooms/:id/invite - Generate invite link
- POST /rooms/join - Join room with invite code

### Friends Endpoints
- GET /friends - Get contacts who are on DARE
- POST /friends/invite - Send invite
- GET /friends/stats - Get friends' completion stats

## TODO
1. Create Supabase tables using SQL scripts
2. Enable RLS policies
3. Set up Storage bucket for media
4. Implement backend API endpoints
5. Connect frontend to API
