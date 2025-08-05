# Creator-Researcher Match - Alpha Version

🚀 **Production-Ready Alpha** - Database-powered with real-world scalability

This is the production-ready alpha version designed for real deployment with database integration and no demo data.

## ✨ Features

- **Database Integration** - Full Supabase PostgreSQL backend
- **CRUD Operations** - Create, read, update, delete for all entities
- **Environment Configuration** - Flexible setup for different environments
- **Scalable Architecture** - Built for growth and real-world usage
- **Clean Slate** - No demo data, ready for real users

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Set up the database**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL commands from `database-setup.sql`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Setup

### Automatic Setup
Run the provided SQL script in your Supabase SQL editor:

```bash
# The database-setup.sql file includes:
# - Table creation (creators, researchers, research_groups)
# - Indexes for performance
# - Row Level Security policies
# - Automatic timestamp updates
```

### Manual Setup
If you prefer to understand the database structure:

#### Tables Created
- **creators** - Content creator profiles and information
- **researchers** - Academic researcher profiles and expertise
- **research_groups** - University labs and research groups

#### Security
- Row Level Security (RLS) enabled
- Authenticated user access policies
- Secure data handling

## 🔧 Tech Stack

- **Frontend**: Svelte 5, Vite 7, TailwindCSS 4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Static hosting compatible
- **Database**: PostgreSQL with full-text search

## 📁 Key Files

- `src/lib/database.js` - Database service layer
- `src/lib/dataStore.js` - Updated for database integration
- `.env.example` - Environment configuration template
- `database-setup.sql` - Complete database schema

## 🔑 Environment Variables

Required environment variables in `.env`:

```bash
# Your Supabase project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Your Supabase anon key (safe for client-side use)
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

### Environment Variables for Deployment
Make sure to set your environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🔒 Security Features

- **Row Level Security** - Database-level access control
- **Environment Variables** - Secure configuration management
- **Input Validation** - Client and server-side validation
- **HTTPS Only** - Secure communication

## 📊 Database Schema

### Creators Table
```sql
- id (UUID, Primary Key)
- name (Text, Required)
- specialization (Text)
- platforms (JSONB Array)
- audience_size (Text)
- bio (Text)
- topics (JSONB Array)
- collaboration_notes (Text)
- created_at, updated_at (Timestamps)
```

### Researchers Table
```sql
- id (UUID, Primary Key)
- name (Text, Required)
- institution (Text)
- field (Text)
- expertise (Text)
- bio (Text)
- topics (JSONB Array)
- availability (Text)
- publications (Integer)
- h_index (Integer)
- recent_work (Text)
- collaboration_notes (Text)
- created_at, updated_at (Timestamps)
```

### Research Groups Table
```sql
- id (UUID, Primary Key)
- university (Text, Required)
- university_location (Text)
- department (Text, Required)
- lab (Text, Required)
- lab_head (Text)
- lab_focus (Text)
- members (JSONB Array)
- created_at, updated_at (Timestamps)
```

## 🔧 Development

### Local Development
```bash
npm run dev
```

### Build & Preview
```bash
npm run build
npm run preview
```

### Database Status Check
The app includes database configuration checking and will display warnings if the database is not properly configured.

## 🎯 Production Considerations

- **Authentication** - Add user authentication for user-specific data
- **Rate Limiting** - Implement API rate limiting
- **Monitoring** - Set up error tracking and performance monitoring
- **Backup Strategy** - Regular database backups
- **Scaling** - Consider CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request

## 📈 Next Steps

- Implement user authentication
- Add real-time features
- Integrate with academic APIs
- Build mobile application
- Add advanced analytics

Ready for real-world deployment and scaling!

---

For the demo version with sample data, see the `creator-researcher-match-demo/` directory.