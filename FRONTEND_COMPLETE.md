# DARE App - Implementation Guide

## Project Status: FRONTEND COMPLETE ✅

This document outlines the current state of the DARE application and provides guidance for backend implementation.

---

## 📱 FRONTEND ARCHITECTURE (COMPLETE)

### Tech Stack
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context (Auth)
- **UI Notifications**: Sonner toast notifications
- **HTTP Client**: Native fetch API with custom apiCall helper
- **Authentication**: Supabase Auth

### Project Structure
```
src/
├── components/
│   ├── Home.tsx                    # Main screen (all 5 sections)
│   ├── Friends.tsx                 # Friends + invite system
│   ├── Profile.tsx                 # Profile + heatmap + settings
│   ├── Auth.tsx                    # Authentication
│   ├── AdminDashboard.tsx          # Admin panel
│   ├── SubmissionModal.tsx         # Submission UI (text/audio/video/photo)
│   ├── CommunitySubmissions.tsx    # Anonymous community submissions
│   └── ui/                         # shadcn/ui components (ready to use)
├── contexts/
│   └── AuthContext.tsx             # Auth state management
├── utils/
│   ├── api.ts                      # Comprehensive API client with all endpoints
│   └── supabase/
│       └── info.tsx                # Supabase config
├── styles/
│   ├── globals.css
│   └── index.css
├── vite.config.ts
└── package.json
```

---

## 🎨 IMPLEMENTED FEATURES

### 1. ✅ HOME SCREEN (5 Sections)
- **Section 1**: Streak & Motivation (always visible)
  - Large flame icon + day count
  - Random motivational messages
  
- **Section 2**: Upcoming Dare (if not live)
  - Countdown timer (HH:MM:SS)
  - Subtle pulse animation
  
- **Section 3**: Today's Dare (if live)
  - Dare text in readable typography
  - "Why this?" explanation section
  - Day indicator badge
  
- **Section 4**: My Submission (One-take rule)
  - 4 submission buttons: Text, Audio, Video, Photo
  - Confirmation modal with warning
  - Shows "✔️ You showed up today" after submission
  
- **Section 5**: Community (Anonymous Submissions)
  - Shows 5-10 random anonymous submissions
  - Expandable cards for text submissions
  - Visual placeholders for audio/video/photo

### 2. ✅ FRIENDS SECTION
- List of friends on DARE with:
  - Name + organization
  - Current streak with flame icon
  - Completion status (Done/Pending badges)
- Friends summary card showing completion %
- **Invite System**:
  - Tab: Share invite link (copy to clipboard)
  - Tab: Send invite via contact (email/phone)
  - Share buttons: WhatsApp, Email
  - Both tabs fully functional UI

### 3. ✅ PROFILE SECTION
- **Stats Cards** (3 columns):
  - Current Streak (orange)
  - Longest Streak (purple)
  - Total Days (blue)
- **12-Week Heatmap Calendar**:
  - Green = completed, Gray = missed
  - Hover tooltips with dates
  - Weekly column layout
- **Notification Settings** (4 toggles):
  - Dare Reminder (30 min before)
  - Dare Drop (when new dare is live)
  - Completion confirmation
  - Streak warning (before it ends)
- **Why DARE** section with philosophy
- **Account Info** section

### 4. ✅ ADMIN DASHBOARD
- **Rooms Tab**:
  - List of all managed rooms
  - Room status, dare drop time, duration
  - Create new room modal with:
    - Name, description
    - Duration selector (7/14/30 days)
    - Time picker for dare drop
  
- **Dares Tab**:
  - Room selector dropdown
  - Create dare modal with:
    - Day number
    - Dare text (required)
    - Explanation (optional)
    - Immutable warning
  - List of scheduled dares
  
- **Stats Tab**:
  - Anonymous participat count
  - Completion rate percentage
  - Average streak
  - Privacy notice (no individual data visible)

### 5. ✅ SUBMISSION MODAL
- Support for 4 types: Text, Audio, Video, Photo
- Confirmation stage before final submission
- One-time warning message
- Loading states during submission
- Error handling with toast notifications

### 6. ✅ AUTHENTICATION
- Email + password signup/signin
- Name required at signup
- Optional organization field
- Session persistence
- Logout functionality
- Role-based UI (admin vs participant)

### 7. ✅ RESPONSIVE DESIGN
- Desktop-first approach with sidebar navigation
- Clean, spacious layout
- Optimized for larger screens
- Keyboard-friendly interactions
- Proper spacing and click targets

### 8. ✅ DARK MODE
- Full dark mode support via Tailwind
- Smooth transitions
- Follows system preference

---

## 🔌 API CLIENT (COMPLETE)

All endpoints documented in `/src/utils/api.ts`:

### Auth Endpoints
```typescript
auth.signUp(email, password, name, organization?)
auth.signIn(email, password)
auth.signOut()
auth.getSession()
auth.getCurrentUser()
```

### User Endpoints
```typescript
user.getProfile()
user.updateProfile(updates)
user.getStats()
user.getSubmissions(limit)
user.getCalendarData()
user.getStreakInfo()
```

### Dare Endpoints
```typescript
dares.getToday()
dares.getForRoom(roomId)
dares.createDare(roomId, day, text, explanation)
```

### Submission Endpoints
```typescript
submissions.checkToday()
submissions.submit(type, content, fileUrl)
submissions.getCommunity(limit)
submissions.getById(submissionId)
submissions.getForRoom(roomId, limit)
```

### Friends Endpoints
```typescript
friends.getList()
friends.syncContacts(contacts)
friends.getWhoHasCompletedToday()
friends.sendInvite(phoneOrEmail)
friends.getInviteLink()
```

### Room Endpoints (Participant)
```typescript
rooms.getMyRooms()
rooms.getRoomById(roomId)
rooms.joinWithInviteCode(inviteCode)
rooms.getParticipantCount(roomId)
```

### Admin Endpoints
```typescript
admin.createRoom(name, description, duration, dareDropTime)
admin.updateRoom(roomId, updates)
admin.deleteRoom(roomId)
admin.getRooms()
admin.createDare(roomId, day, text, explanation)
admin.updateDare(dareId, updates)
admin.deleteDare(dareId)
admin.getDares(roomId)
admin.getDareStats(roomId)
admin.getParticipationStats(roomId)
admin.getStreakDistribution(roomId)
admin.getRoomStats(roomId)
admin.generateInviteCode(roomId)
admin.getStats()
```

---

## 🔧 BACKEND REQUIREMENTS

### Database Tables Needed

1. **users**
   - id (UUID)
   - email (string, unique)
   - phone (string, optional)
   - name (string)
   - organization (string, optional)
   - role ('participant' | 'admin')
   - current_streak (int)
   - longest_streak (int)
   - total_days_shown_up (int)
   - last_submission_date (date)
   - auth_id (FK to auth.users)
   - timestamps

2. **rooms**
   - id (UUID)
   - admin_id (FK to users)
   - name (string)
   - description (text, optional)
   - dare_drop_time (time)
   - duration (int: 7, 14, 30)
   - current_day (int)
   - status ('active' | 'inactive' | 'completed')
   - timestamps

3. **room_participants**
   - id (UUID)
   - room_id (FK)
   - user_id (FK)
   - joined_at (timestamp)
   - UNIQUE(room_id, user_id)

4. **dares**
   - id (UUID)
   - room_id (FK)
   - day (int)
   - text (string)
   - explanation (text)
   - timestamps
   - UNIQUE(room_id, day)

5. **submissions**
   - id (UUID)
   - user_id (FK)
   - room_id (FK)
   - dare_id (FK)
   - submission_date (date)
   - submission_type ('text' | 'audio' | 'video' | 'photo')
   - content (text, optional)
   - file_url (string, optional)
   - file_size (int, optional)
   - timestamps
   - UNIQUE(user_id, room_id, submission_date) ← Enforces one submission per day

6. **streaks**
   - id (UUID)
   - user_id (FK)
   - room_id (FK)
   - current_streak (int)
   - longest_streak (int)
   - last_submission_date (date)
   - updated_at (timestamp)

7. **notification_settings**
   - id (UUID)
   - user_id (FK, unique)
   - dare_drop_notification (bool, default true)
   - dare_reminder_notification (bool, default true)
   - streak_warning_notification (bool, default true)
   - completion_confirmation (bool, default true)
   - updated_at (timestamp)

8. **invites**
   - id (UUID)
   - room_id (FK)
   - invite_code (string, unique)
   - created_at (timestamp)
   - expires_at (timestamp, optional)

### API Endpoints to Implement

See SETUP.md for complete endpoint documentation.

### Key Business Logic

1. **Streak Calculation**
   - Increment only if user submits on the same day (using submission_date)
   - Reset to 0 if user misses a day (no submission for dare that dropped)
   - Track longest_streak separately

2. **One-Time Submission Rule**
   - Use UNIQUE constraint on (user_id, room_id, submission_date)
   - Return error if trying to submit twice on same day
   - No edit/delete endpoints for submissions

3. **Dare Scheduling**
   - Each room has dare_drop_time (e.g., "09:00")
   - Dares are day-based, not timestamp-based
   - Check user's timezone? (Consider for future)

4. **Anonymous Submissions**
   - GET /submissions/community returns NO user info
   - Only: submission_type, content, file_url, createdAt
   - Random sample of submissions

5. **Admin Restrictions**
   - Cannot view individual submissions
   - Cannot edit dare after publishing
   - Cannot delete dare after publishing
   - Can only see aggregated, anonymous statistics

---

## 🚨 REMAINING WORK

### 1. Backend Implementation
- Create all API endpoints
- Set up Supabase functions or backend server
- Implement database schema
- Add authentication with Supabase Auth
- Implement streak logic
- Add notification scheduling (cron jobs)
- File upload to storage

### 2. Push Notifications
- Notification scheduling system
- 30-min before dare drop
- When dare goes live
- Streak warnings
- Completion confirmations

### 3. Media Upload
- Audio recording + upload
- Video recording + upload
- Photo capture + upload
- File size limits
- Virus scanning

### 4. Future Features
- Premium features (streak skip, analytics)
- Room invites QR code generation
- Contact sync (with permissions)
- Timezone handling
- Analytics dashboard
- Rate limiting
- Backup/export data

---

## 📚 COMPONENT USAGE

### To use the app in development:

```bash
npm install
npm run dev
```

### Authentication Flow
1. User sees Auth component
2. Fills email/password/name
3. Calls auth.signUp()
4. AuthContext updates
5. Router shows Home screen

### Submission Flow
1. User clicks submission type button
2. SubmissionModal opens
3. User enters content
4. Confirmation modal appears
5. User confirms → onSubmit callback
6. API called → success/error toast
7. Home refreshes with hasSubmitted = true

---

## 💻 WEB-FIRST IMPLEMENTATION

All components use:
- Persistent sidebar navigation
- Desktop-optimized spacing and layout
- Clean, spacious design
- Keyboard-friendly interactions
- Hover states for better UX

---

## 🔐 SECURITY NOTES

1. **All endpoints require authentication** (except auth endpoints)
2. **Row-Level Security (RLS)** should be enabled on all tables
3. **Users can only see their own data** (friends list, submissions, profile)
4. **Admins can only see RLS data for rooms they manage**
5. **No user IDs in community submissions**

---

## 📝 NEXT STEPS FOR BACKEND DEVELOPERS

1. **Set up Supabase project** with schema from SETUP.md
2. **Create Edge Functions** for API endpoints
3. **Implement authentication** with existing Supabase Auth
4. **Add RLS policies** for data security
5. **Set up storage bucket** for media uploads
6. **Implement streak calculation logic**
7. **Add notification scheduling** (cron jobs)
8. **Test all endpoints** with provided API client

---

## 📞 SUPPORT

For questions about:
- Frontend implementation → Check component code comments
- API structure → See /src/utils/api.ts
- Database schema → See SETUP.md
- UI/UX → See spec at top of this document
