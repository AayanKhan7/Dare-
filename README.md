
# DARE - Daily Challenge App

> *"A quiet space in a noisy phone"*

DARE is a web application focused on daily time-bound challenges that encourage consistency, self-awareness, and participation through streaks. This is **not social media** — no likes, no comments, no followers, no public profiles.

## 🎯 Core Philosophy

The primary goal: **Make it easier to show up once a day than to quit.**

DARE helps users build consistency through:
- One daily dare (challenge)
- One-time submission (no edits, no deletes)
- Streak-based motivation
- Anonymous community presence
- Calm, minimal, non-addictive design

---

## ✨ Key Features

### For Participants
- ✅ **Daily Dares** - Time-bound challenges with explanations
- 🔥 **Streak Tracking** - Current streak, longest streak, total days
- 📝 **One-Time Submissions** - Text, audio, video, or photo responses
- 👥 **Friends** - See who's showing up without competition
- 📊 **Activity Heatmap** - Visualize your 12-week journey
- 🔔 **Smart Notifications** - Dare drops, reminders, streak warnings
- 🌍 **Community Feed** - Anonymous glimpses of others' responses

### For Admins
- 🏢 **Room Creation** - Organize dares for specific groups
- ⏰ **Custom Scheduling** - Set dare drop times
- 📅 **Dare Management** - Create and schedule daily challenges
- 📈 **Aggregated Stats** - Participation rates, streak distribution
- 🔒 **Privacy-First** - Cannot view individual submissions

---

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React Context API
- **Routing:** Client-side navigation
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)

### Backend (Supabase)
- **Database:** PostgreSQL with Row-Level Security
- **Authentication:** Supabase Auth (email/password)
- **Storage:** Supabase Storage for media uploads
- **API:** Supabase Edge Functions / REST API
- **Real-time:** PostgreSQL triggers for streak calculations

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Supabase account (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dare-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Navigate to `http://localhost:5173`

---

## 📱 Application Structure

```
src/
├── components/
│   ├── Home.tsx              # Main dare screen
│   ├── Friends.tsx           # Friends & invites
│   ├── Profile.tsx           # User stats & settings
│   ├── AdminDashboard.tsx    # Admin room management
│   ├── Auth.tsx              # Authentication
│   ├── SubmissionModal.tsx   # Submission interface
│   ├── CommunitySubmissions.tsx  # Anonymous feed
│   └── ui/                   # Reusable UI components
├── contexts/
│   └── AuthContext.tsx       # Auth state management
├── utils/
│   ├── api.ts               # API client
│   └── supabase/
│       └── info.tsx         # Supabase config
├── App.tsx                  # Main app component
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

---

## 🎨 Design Principles

### UI/UX Rules
1. **Minimal color palette** - Soft gradients, calm tones
2. **Large readable typography** - Easy on the eyes
3. **Gentle animations** - Never aggressive
4. **Dark mode support** - OLED-friendly
5. **No clutter** - One focus at a time
6. **No infinite scrolling** - Finite, bounded interactions
7. **No dopamine loops** - No variable rewards or gamification tricks

### Desktop-First Approach
- Persistent sidebar navigation
- Optimized for larger screens and desktop workflows
- Clean, spacious layout
- Keyboard-friendly navigation
- Desktop-optimized interactions

---

## 🗄️ Backend Setup

See [`BACKEND_IMPLEMENTATION.md`](BACKEND_IMPLEMENTATION.md) for complete backend setup guide.

### Quick Backend Checklist
1. ✅ Create Supabase project
2. ✅ Run database migrations ([`SETUP.md`](SETUP.md))
3. ✅ Enable Row-Level Security
4. ✅ Set up Storage bucket for media
5. ✅ Deploy API endpoints
6. ✅ Configure scheduled jobs (dare rotation, notifications)

---

## 🔐 Security Features

- **Row-Level Security** on all database tables
- **One submission per day** enforced at database level
- **Anonymous community** - user IDs never exposed
- **Admin verification** before room/dare creation
- **File upload validation** and size limits
- **Rate limiting** on API endpoints
- **HTTPS-only** connections
- **JWT-based authentication**

---

## 📊 Key User Flows

### 1. New User Onboarding
```
Sign Up → Join Room (via invite) → See Today's Dare → Submit Response → Join Community
```

### 2. Daily Participation
```
Open App → View Streak → Read Dare → Submit (Text/Audio/Video/Photo) → See Community
```

### 3. Admin Flow
```
Create Room → Set Schedule → Add Dares → Share Invite → Monitor Stats
```

---

## 🧪 Testing

```bash
# Run all tests (when implemented)
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

---

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder to hosting service
```

### Environment Variables
Set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📚 Documentation

- [`SETUP.md`](SETUP.md) - Database schema and initial setup
- [`BACKEND_IMPLEMENTATION.md`](BACKEND_IMPLEMENTATION.md) - Complete backend API guide
- [`/src/guidelines/Guidelines.md`](src/guidelines/Guidelines.md) - Design guidelines

---

## 🤝 Contributing

This is a private project. If you have access:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit pull request
5. Wait for review

### Code Standards
- Use TypeScript for type safety
- Follow existing naming conventions
- Keep components small and focused
- Write meaningful commit messages
- Test on both mobile and desktop

---

## 🐛 Known Issues

- [ ] Media upload (audio/video/photo) requires backend implementation
- [ ] Notification system needs FCM setup
- [ ] Contact sync needs privacy controls
- [ ] Offline mode not yet supported

---

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Core UI implementation
- ✅ Authentication flow
- ✅ Home screen with dare display
- ✅ Submission interface
- ✅ Friends section
- ✅ Profile with heatmap
- ✅ Admin dashboard
- ✅ Desktop-focused responsive design

### Phase 2 (Next)
- [ ] Backend API implementation
- [ ] Media upload functionality
- [ ] Push notifications
- [ ] Streak calculation logic
- [ ] Email notifications
- [ ] Contact sync

### Phase 3 (Future)
- [ ] Mobile responsive support
- [ ] Progressive Web App (PWA)
- [ ] Offline mode
- [ ] Premium features
- [ ] Advanced analytics
- [ ] Multi-language support

---

## 📄 License

Proprietary - All rights reserved

---

## 👏 Credits

Built with:
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com)
- [Lucide Icons](https://lucide.dev)
- [Sonner](https://sonner.emilkowal.ski)

---

## 💬 Contact

For questions or support, contact the development team.

---

**Remember:** DARE is about showing up for yourself, one day at a time. 🔥
  