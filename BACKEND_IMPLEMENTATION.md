# DARE Backend Implementation Guide

## Overview
This guide details the backend API endpoints that need to be implemented using Supabase Edge Functions or your preferred backend framework.

## Authentication Setup

### Supabase Auth Configuration
1. Enable Email/Password authentication in Supabase Dashboard
2. Configure email templates for signup confirmations
3. Set up Row Level Security (RLS) policies on all tables

### User Creation Flow
When a user signs up:
1. Create auth.users entry (handled by Supabase Auth)
2. Create corresponding users table entry via trigger or API endpoint
3. Initialize notification_settings for the user
4. Return user profile data

## Required API Endpoints

### 1. Authentication Endpoints

#### POST `/auth/signup`
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "organization": "MIT" // optional
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {...}
}
```

**Implementation Notes:**
- Create user in auth.users via Supabase Admin SDK
- Create user profile in users table
- Set default role as 'participant'
- Initialize streak values to 0

---

### 2. User Endpoints

#### GET `/user/profile`
**Auth Required:** Yes

```json
Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "organization": "MIT",
  "role": "participant",
  "currentStreak": 5,
  "longestStreak": 12,
  "totalDaysShownUp": 47,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

#### GET `/user/stats`
**Auth Required:** Yes

```json
Response:
{
  "currentStreak": 5,
  "longestStreak": 12,
  "totalDaysShownUp": 47,
  "submissionCount": 50
}
```

**Logic:**
- Calculate current streak by checking consecutive submission dates
- Get longest streak from users.longest_streak
- Count total days with submissions

#### GET `/user/calendar`
**Auth Required:** Yes

```json
Response:
{
  "dates": [
    {
      "date": "2026-01-15",
      "hasSubmission": true
    }
    // ... last 90 days
  ]
}
```

---

### 3. Dare Endpoints

#### GET `/dares/today`
**Auth Required:** Yes

```json
Response:
{
  "dare": {
    "id": "uuid",
    "day": 4,
    "text": "Tell us one thing you notice in people that others don't.",
    "explanation": "This helps you become more observant.",
    "roomId": "uuid"
  },
  "timeLeft": "05:23:45", // optional
  "isLive": true
}
```

**Logic:**
1. Get user's active room (join room_participants)
2. Get room's dare_drop_time and current_day
3. Return dare for current day
4. Calculate time until next dare if current dare not live

#### GET `/dares/room/:roomId`
**Auth Required:** Yes (Admin only)

```json
Response: [
  {
    "id": "uuid",
    "day": 1,
    "text": "Dare text...",
    "explanation": "Why this dare...",
    "roomId": "uuid",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

#### POST `/dares/create`
**Auth Required:** Yes (Admin only)

```json
Request:
{
  "roomId": "uuid",
  "day": 5,
  "text": "What's something you've been avoiding?",
  "explanation": "Facing what we avoid builds courage."
}

Response:
{
  "id": "uuid",
  "day": 5,
  "text": "...",
  "explanation": "...",
  "roomId": "uuid"
}
```

**Validation:**
- Ensure day number doesn't exceed room.duration
- Check for duplicate day in same room
- Verify user is admin of the room

---

### 4. Submission Endpoints

#### POST `/submissions/submit`
**Auth Required:** Yes

```json
Request:
{
  "type": "text|audio|video|photo",
  "content": "My response text...", // for text submissions
  "fileUrl": "https://..." // for media submissions
}

Response:
{
  "id": "uuid",
  "success": true,
  "streakUpdated": true,
  "newStreak": 6
}
```

**Critical Validation:**
- Check if user already submitted today (UNIQUE constraint)
- Verify dare is live for today
- Update user's streak logic:
  ```
  - If last_submission_date is yesterday: currentStreak++
  - If last_submission_date is today: reject (already submitted)
  - If gap > 1 day: currentStreak = 1
  - Update longest_streak if currentStreak > longest_streak
  ```
- Set submission_date to current date

#### GET `/submissions/check-today`
**Auth Required:** Yes

```json
Response:
{
  "hasSubmitted": true,
  "submission": {
    "type": "text",
    "content": "...",
    "createdAt": "2026-02-10T10:30:00Z"
  }
}
```

#### GET `/submissions/community?limit=10`
**Auth Required:** Yes

```json
Response: [
  {
    "id": "uuid",
    "submissionType": "text",
    "content": "Anonymous content...",
    "createdAt": "2026-02-10T09:15:00Z"
  }
]
```

**Privacy Rules:**
- NEVER include userId in response
- Randomize order
- Only return submissions from the same room
- Only return submissions from today
- Limit to 10 results

---

### 5. Room Endpoints (Participant)

#### GET `/rooms/my-rooms`
**Auth Required:** Yes

```json
Response: [
  {
    "id": "uuid",
    "name": "MIT Spring Challenge",
    "description": "...",
    "dareDropTime": "09:00",
    "duration": 30,
    "currentDay": 5,
    "status": "active"
  }
]
```

#### POST `/rooms/join`
**Auth Required:** Yes

```json
Request:
{
  "inviteCode": "ABC123"
}

Response:
{
  "success": true,
  "room": {...}
}
```

**Logic:**
- Verify invite code exists and not expired
- Check user not already in room
- Create room_participants entry
- Return room details

---

### 6. Admin Endpoints

#### POST `/admin/rooms`
**Auth Required:** Yes (Admin role)

```json
Request:
{
  "name": "Spring 2026 Challenge",
  "description": "30-day journey",
  "duration": 30,
  "dareDropTime": "09:00"
}

Response:
{
  "id": "uuid",
  "name": "...",
  "adminId": "uuid",
  "status": "active",
  "currentDay": 1
}
```

#### GET `/admin/rooms/:roomId/stats`
**Auth Required:** Yes (Admin of room)

```json
Response:
{
  "totalParticipants": 150,
  "dailyParticipationToday": 127,
  "completionRate": 84.6,
  "streakDistribution": {
    "0-5": 20,
    "6-10": 45,
    "11-20": 60,
    "21+": 25
  }
}
```

**Privacy:**
- All stats must be aggregated
- Never expose individual user data
- Streak distribution in ranges only

#### POST `/admin/rooms/:roomId/invite-code`
**Auth Required:** Yes (Admin of room)

```json
Response:
{
  "inviteCode": "XYZ789",
  "expiresAt": "2026-03-10T00:00:00Z"
}
```

---

### 7. Friends Endpoints

#### GET `/friends`
**Auth Required:** Yes

```json
Response: [
  {
    "id": "uuid",
    "name": "Jane Smith",
    "organization": "Stanford",
    "currentStreak": 8,
    "completedToday": true
  }
]
```

**Logic:**
- Query friends relationship table
- Join with users to get public profile data
- Check today's submissions to set completedToday

#### POST `/friends/sync`
**Auth Required:** Yes

```json
Request:
{
  "contacts": [
    {
      "name": "John Doe",
      "phone": "+1234567890"
    }
  ]
}

Response:
{
  "matched": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+1234567890"
    }
  ]
}
```

**Privacy:**
- Hash phone numbers before comparison
- Only return users who have opted into contact sync

#### POST `/friends/invite`
**Auth Required:** Yes

```json
Request:
{
  "phoneOrEmail": "friend@example.com"
}

Response:
{
  "success": true,
  "message": "Invite sent"
}
```

---

## Database Triggers

### Streak Calculation Trigger
```sql
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user streak when submission is created
  UPDATE users
  SET 
    current_streak = CASE
      WHEN last_submission_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      longest_streak, 
      CASE
        WHEN last_submission_date = CURRENT_DATE - INTERVAL '1 day' 
          THEN current_streak + 1
        ELSE 1
      END
    ),
    last_submission_date = CURRENT_DATE,
    total_days_shown_up = total_days_shown_up + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_submission_created
  AFTER INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();
```

### Room Day Incrementor
```sql
-- Run daily via scheduled job
CREATE OR REPLACE FUNCTION increment_room_days()
RETURNS void AS $$
BEGIN
  UPDATE rooms
  SET current_day = current_day + 1
  WHERE status = 'active'
    AND CURRENT_TIME >= dare_drop_time::TIME
    AND current_day < duration;
  
  -- Mark completed rooms
  UPDATE rooms
  SET status = 'completed'
  WHERE current_day >= duration;
END;
$$ LANGUAGE plpgsql;
```

---

## Row-Level Security Policies

### Users Table
```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);
```

### Submissions Table
```sql
-- Users can insert their own submissions
CREATE POLICY "Users can create own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- For community view, create a special function that returns anonymized data
```

### Rooms Table (Admin)
```sql
-- Admins can manage their rooms
CREATE POLICY "Admins can manage own rooms"
  ON rooms FOR ALL
  USING (admin_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Participants can view rooms they're in
CREATE POLICY "Participants can view joined rooms"
  ON rooms FOR SELECT
  USING (id IN (
    SELECT room_id FROM room_participants 
    WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  ));
```

---

## File Storage (Media Uploads)

### Supabase Storage Bucket Setup
1. Create bucket: `dare-submissions`
2. Set policies:
   ```sql
   -- Users can upload their own files
   CREATE POLICY "Users upload own files"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'dare-submissions' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   
   -- Files are publicly readable
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'dare-submissions');
   ```

### Upload Flow
1. Client requests signed URL from backend
2. Client uploads file directly to Storage
3. Client sends file URL in submission request
4. Backend validates URL belongs to user
5. Store file_url in submissions table

---

## Scheduled Jobs (Cron)

### Daily Room Incrementor
**Schedule:** Every day at 00:01 UTC
```sql
SELECT increment_room_days();
```

### Streak Break Notifier
**Schedule:** Every day at 22:00 local time
```sql
-- Find users who haven't submitted today
SELECT send_streak_warning_notification(user_id)
FROM users
WHERE current_streak > 0
  AND last_submission_date < CURRENT_DATE;
```

### Cleanup Old Invites
**Schedule:** Every day at 03:00 UTC
```sql
DELETE FROM invites
WHERE expires_at < CURRENT_TIMESTAMP;
```

---

## Notifications

### Push Notification Events
1. **Dare Drop** - When new dare goes live
2. **Dare Reminder** - 30 min before dare drops
3. **Streak Warning** - 2 hours before day ends, if not submitted
4. **Completion** - Immediately after submission

### Implementation
Use Firebase Cloud Messaging (FCM) or similar:
```typescript
async function sendNotification(userId: string, type: string, data: any) {
  const tokens = await getDeviceTokens(userId);
  const settings = await getNotificationSettings(userId);
  
  if (!settings[type]) return; // User disabled this notification
  
  await fcm.send({
    tokens,
    notification: {
      title: getNotificationTitle(type),
      body: getNotificationBody(type, data)
    }
  });
}
```

---

## Testing Checklist

- [ ] User signup creates all required records
- [ ] Submission enforces one-per-day limit
- [ ] Streak calculation handles edge cases (first submission, streak break, continuation)
- [ ] Admin cannot see individual submissions
- [ ] Community submissions are truly anonymous
- [ ] RLS policies prevent unauthorized data access
- [ ] File uploads are validated and scoped to user
- [ ] Invite codes work and expire correctly
- [ ] Room day increments at correct time
- [ ] Notifications respect user preferences

---

## Security Considerations

1. **Never expose user_id** in community submissions
2. **Validate admin role** before allowing room/dare creation
3. **Rate limit** submission attempts (1 per day per user)
4. **Sanitize all user input** to prevent injection attacks
5. **Verify file types** for media uploads
6. **Implement CORS** correctly for API endpoints
7. **Use HTTPS** for all connections
8. **Hash sensitive data** like phone numbers
9. **Audit logs** for admin actions
10. **Implement request throttling** to prevent abuse

---

## Performance Optimization

1. **Index frequently queried fields:**
   - users(auth_id)
   - submissions(user_id, submission_date)
   - rooms(admin_id, status)
   - dares(room_id, day)

2. **Cache frequently accessed data:**
   - Today's dare per room
   - User streak information
   - Room participant counts

3. **Optimize queries:**
   - Use joins instead of multiple queries
   - Limit community submissions to reasonable number
   - Paginate large result sets

---

## Deployment Steps

1. Set up Supabase project
2. Run SQL migrations to create tables
3. Enable RLS on all tables
4. Create security policies
5. Set up Storage bucket
6. Deploy Edge Functions/API endpoints
7. Configure scheduled jobs (cron)
8. Set up notification service (FCM)
9. Test all endpoints thoroughly
10. Monitor error logs and performance

---

## Next Steps

1. Implement backend API endpoints
2. Test streak calculation logic thoroughly
3. Set up media storage and upload flow
4. Implement notification system
5. Create admin dashboard analytics
6. Deploy to production
7. Monitor and optimize based on usage
