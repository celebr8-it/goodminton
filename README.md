# Goodminton 🏸

A modern, beautiful web application for managing amateur badminton tournaments. Create groups, organize tournaments, generate random teams, and track matches with your friends.

> **⚠️ Project Status**: ~40% Complete - Core match recording system in development

## ✨ Current Features (Working)

- 🔐 **Authentication** - Secure email-based signup/login with Supabase Auth
- 👥 **Group Management** - Create and manage badminton groups with friends
- 🏆 **Tournament Setup** - Create tournaments with customizable scoring formats
- 🎲 **Random Team Generator** - Automatically generate balanced doubles teams
- 🎨 **Modern UI** - Beautiful design with smooth animations and dark/light modes
- � **Responsive Design** - Works great on desktop, tablet, and mobile
- 🌓 **Theme System** - Easily customizable color scheme (change 1 variable!)

## 🚧 In Development

- 📊 **Match Recording** - Set-by-set score tracking (NEXT PRIORITY)
- � **Tournament Flow** - Complete tournament lifecycle management
- 📈 **Leaderboards** - Tournament standings and player stats
- 🔴 **Real-time Updates** - Live score updates with Supabase Realtime
- 📸 **Image Uploads** - Group photos and user avatars

See **PROGRESS.md** for the complete feature roadmap.

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Icons**: Lucide React
- **Routing**: React Router v7

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/goodminton.git
cd goodminton
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up Supabase:**

   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase_schema.sql` in the SQL Editor
   - Run the RLS fix from `fix_rls.sql` if needed
   - Create storage buckets: `avatars` and `group-images` (set to public)

4. **Configure environment variables:**
   - Create a `.env.local` file and add your credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Open your browser:**
   - Navigate to [http://localhost:5173](http://localhost:5173)
   - Create an account and start organizing tournaments!

## 📁 Project Structure

```
goodminton/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── EmptyState.jsx
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Auth.jsx
│   │   ├── Groups.jsx
│   │   ├── Tournaments.jsx
│   │   └── ...
│   ├── router/             # Route configuration
│   │   └── index.jsx
│   ├── lib/                # Utilities & context
│   │   ├── supabase.js
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── constants.js
│   │   └── styles.js
│   ├── App.jsx             # Main app entry
│   └── index.css           # Global styles & theme
├── 📄 Documentation/
│   ├── SUMMARY.md          # Complete project analysis
│   ├── PROGRESS.md         # Feature checklist
│   ├── THEME_GUIDE.md      # Theme customization
│   ├── REFACTORING.md      # Code improvements
│   └── QUICK_REFERENCE.md  # Developer quick start
├── supabase_schema.sql     # Database schema
├── fix_rls.sql             # RLS policy fixes
└── requirements.md         # Product requirements
```

## 🎨 Customizing the Theme

Want to change the app's color from purple to your favorite color? It's easy!

Open `src/index.css` and change ONE number:

```css
:root {
  --theme-hue: 248; /* 👈 Change this! */
}
```

**Try these:**

- `215` - Blue (professional)
- `142` - Green (fresh)
- `330` - Pink (vibrant)
- `25` - Orange (energetic)

See **THEME_VISUAL_GUIDE.md** for more options and details.

## 📚 Documentation

Comprehensive guides are available:

- **SUMMARY.md** - Complete project analysis and status
- **PROGRESS.md** - Detailed feature checklist (what's done, what's left)
- **THEME_GUIDE.md** - How to customize colors
- **THEME_VISUAL_GUIDE.md** - Visual theme examples
- **REFACTORING.md** - Code structure improvements
- **QUICK_REFERENCE.md** - Developer quick reference

## 🎯 Development Roadmap

### ✅ Phase 1 - Foundation (Complete)

- [x] Authentication system
- [x] Group management
- [x] Member invitations
- [x] Tournament creation
- [x] Team randomization
- [x] Dark/light theme
- [x] Responsive design

### 🚧 Phase 2 - Core Features (In Progress)

- [ ] Match recording interface ⭐ **NEXT**
- [ ] Set-by-set scoring
- [ ] Match detail page
- [ ] Tournament flow (start/complete)
- [ ] Tournament standings
- [ ] Winner calculation

### 📋 Phase 3 - Enhancement (Planned)

- [ ] Real-time score updates
- [ ] Image uploads (groups, avatars)
- [ ] User profiles
- [ ] Match history
- [ ] Player statistics
- [ ] Tournament brackets

### ✨ Phase 4 - Polish (Future)

- [ ] Notifications
- [ ] Search & filters
- [ ] Export results
- [ ] Mobile app (PWA)
- [ ] Tournament templates

## 🤝 Contributing

This is currently a private project in active development. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - feel free to use this project for your own badminton groups!

## 🙏 Acknowledgments

Built with ❤️ for badminton enthusiasts everywhere.
