# Goodminton 🏸

A modern, beautiful web application for managing badminton tournaments with friends. Create groups, organize tournaments, generate random teams, track match scores, and view player analytics.

## ✨ Features

- 🔐 **Authentication** - Secure email-based signup/login with Supabase Auth
- 👥 **Group Management** - Create and manage badminton groups with friends
- 🏆 **Tournament Organization** - Set up tournaments with customizable formats
- 🎲 **Random Team Generator** - Automatically generate balanced teams
- 📊 **Match Tracking** - Record detailed match scores and statistics
- 📈 **Analytics** - View player and match analytics (Coming Soon)
- 🎨 **Modern UI** - Beautiful glassmorphism design with smooth animations

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS v3
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React
- **Routing**: React Router v7

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/goodminton.git
cd goodminton
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project in Supabase
   - Run the SQL schema from `supabase_schema.sql` in the SQL Editor
   - Run the RLS fix from `fix_rls.sql` if needed
   - Create storage buckets: `avatars` and `group-images` (set to public)

4. Configure environment variables:
   - Copy `.env` to `.env.local` and add your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📁 Project Structure

```
goodminton/
├── src/
│   ├── components/     # Reusable UI components
│   ├── lib/           # Utilities (Supabase client, Auth context)
│   ├── pages/         # Page components (Auth, Groups, etc.)
│   ├── App.jsx        # Main app with routing
│   └── index.css      # Global styles
├── supabase_schema.sql # Database schema
├── fix_rls.sql        # RLS policy fixes
└── package.json
```

## 🎯 Roadmap

- [x] Authentication system
- [x] Group management
- [x] Member management
- [ ] Tournament creation
- [ ] Team randomization
- [ ] Match recording interface
- [ ] Live scoring
- [ ] Player analytics
- [ ] Tournament brackets visualization

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - feel free to use this project for your own badminton groups!

## 🙏 Acknowledgments

Built with ❤️ for badminton enthusiasts everywhere.
