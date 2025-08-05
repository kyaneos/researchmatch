# ResearchMatch Platform

A web application designed to bridge the gap between scientific researchers and content creators, making research and research funding more accessible to the general public.

## 🌟 Project Context

This project was developed during the **[ACM Collective Intelligence 2025](https://ci.acm.org/2025/)** hackathon by:
- **[Justin Moran](https://kyaneos.github.io/cv/)**
- **[Dr. Jeff Nickerson](https://www.stevens.edu/profile/jnickers)** 
- **[Gisele Batista](https://www.linkedin.com/in/giselebatista/)**
- **[Jeongeon Park](https://jeongeonpark.com/)**

### The Challenge
During our hackathon sprint, we tackled the critical question: **"How do we make research and research funding more palatable to the general public?"**

### Our Solution
We created a platform that facilitates meaningful connections between researchers and content creators, enabling:
- Researchers to find skilled communicators to help translate their work for broader audiences
- Content creators to discover cutting-edge research for their content
- Enhanced public understanding of scientific research and its impact
- Better visibility for research funding opportunities

## 🌐 Live Demo

🎯 **Try it now!** Both versions are deployed and ready to explore:

- **🎪 Demo Version**: [View Live Demo](https://kyaneos.github.io/researchmatch/demo/) - *Ready to use with sample data*
- **🚀 Alpha Version**: [View Live Alpha](https://kyaneos.github.io/researchmatch/alpha/) - *Production-ready with database*

> **Note**: Replace `your-username` and `your-repo-name` with your actual GitHub details after deployment.

## 🏗️ Repository Structure

This repository contains two versions of the application:

### 📁 `creator-researcher-match-demo/`
The original hackathon demo version with:
- Pre-populated demo data
- JSON-based data storage
- Full UI/UX showcase
- Immediate functionality for demonstration purposes
- **🌐 [Live Demo](https://your-username.github.io/your-repo-name/demo/)**

### 📁 `creator-researcher-match-alpha/`
The production-ready alpha version featuring:
- Database integration (Supabase)
- Environment-based configuration
- CRUD operations for all entities
- Scalable architecture
- No demo data (clean slate for real deployment)
- **🌐 [Live Alpha](https://your-username.github.io/your-repo-name/alpha/)**

## 🚀 Features

### Core Functionality
- **Smart Matching Algorithm**: Intelligent pairing based on research interests, expertise, and collaboration preferences
- **Advanced Search & Filtering**: Find researchers or creators by field, topic, institution, or collaboration style
- **User Profiles**: Comprehensive profiles for both researchers and content creators
- **Research Group Discovery**: Explore academic research groups and labs
- **Communication Tools**: Built-in messaging and conversation starter features
- **Analytics Dashboard**: Track connections and collaboration metrics

### Technical Features
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Search**: Instant results with advanced filtering
- **Caching System**: Efficient data management with local caching
- **Database Integration**: Scalable backend with Supabase
- **Modern Tech Stack**: Built with Svelte, Vite, and TailwindCSS

## 🛠️ Technology Stack

- **Frontend**: Svelte 5, Vite 7
- **Styling**: TailwindCSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Static hosting compatible (Vercel, Netlify, etc.)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for alpha version)

### Demo Version Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CI\ 2025/creator-researcher-match-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Alpha Version Setup

1. **Navigate to alpha version**
   ```bash
   cd CI\ 2025/creator-researcher-match-alpha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL commands from `database-setup.sql` in your Supabase SQL editor
   - This will create the necessary tables and security policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Navigate to `http://localhost:5173`

## 🗄️ Database Schema (Alpha Version)

### Tables

#### `creators`
- `id` (UUID, Primary Key)
- `name` (Text, Required)
- `specialization` (Text)
- `platforms` (JSONB Array)
- `audience_size` (Text)
- `bio` (Text)
- `topics` (JSONB Array)
- `collaboration_notes` (Text)
- `created_at`, `updated_at` (Timestamps)

#### `researchers`
- `id` (UUID, Primary Key)
- `name` (Text, Required)
- `institution` (Text)
- `field` (Text)
- `expertise` (Text)
- `bio` (Text)
- `topics` (JSONB Array)
- `availability` (Text)
- `publications` (Integer)
- `h_index` (Integer)
- `recent_work` (Text)
- `collaboration_notes` (Text)
- `created_at`, `updated_at` (Timestamps)

#### `research_groups`
- `id` (UUID, Primary Key)
- `university` (Text, Required)
- `university_location` (Text)
- `department` (Text, Required)
- `lab` (Text, Required)
- `lab_head` (Text)
- `lab_focus` (Text)
- `members` (JSONB Array)
- `created_at`, `updated_at` (Timestamps)

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Project Structure
```
src/
├── lib/                    # Svelte components
│   ├── Analytics.svelte    # Analytics dashboard
│   ├── Discover.svelte     # User discovery page
│   ├── Home.svelte         # Homepage
│   ├── Messages.svelte     # Messaging interface
│   ├── Nav.svelte          # Navigation component
│   ├── Profile.svelte      # User profiles
│   ├── UnifiedSearch.svelte # Search functionality
│   ├── UserCard.svelte     # User display cards
│   ├── database.js         # Database service (alpha)
│   ├── dataService.js      # Data fetching logic
│   ├── dataStore.js        # Global state management
│   ├── matchingService.js  # Matching algorithms
│   └── ...
├── App.svelte             # Main application component
├── main.js               # Application entry point
└── app.css              # Global styles
```

## 🚀 Deployment

This repository is configured for automatic deployment to GitHub Pages! 

### Quick Deploy Steps:
1. **Push to GitHub**: `git push origin main`
2. **Enable GitHub Pages**: Go to Settings → Pages → Set source to "GitHub Actions"
3. **Access your apps**: 
   - Demo: `https://your-username.github.io/your-repo-name/demo/`
   - Alpha: `https://your-username.github.io/your-repo-name/alpha/`

### For Alpha Version Database:
Add these secrets in GitHub Settings → Secrets and variables → Actions:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

📖 **[Full Deployment Guide](DEPLOYMENT.md)**

## 🤝 Contributing

This project was created during a hackathon and represents a proof of concept. We welcome contributions to improve and expand the platform:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📈 Future Roadmap

- [ ] User authentication and authorization
- [ ] Real-time messaging system
- [ ] Advanced matching algorithms with ML
- [ ] Integration with academic databases (ORCID, Google Scholar)
- [ ] Mobile application
- [ ] Collaboration project tracking
- [ ] Analytics and reporting dashboard
- [ ] API for third-party integrations

## 🎯 Impact Goals

Our platform aims to:
- **Increase public engagement** with scientific research
- **Improve science communication** through creator-researcher partnerships
- **Enhance research visibility** and funding opportunities
- **Bridge the gap** between academic and public spheres
- **Foster innovation** through interdisciplinary collaboration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ACM Collective Intelligence 2025** for hosting the hackathon
- All researchers and content creators who inspired this solution
- The open-source community for the amazing tools and libraries
- Our hackathon teammates for their collaborative spirit

## 📧 Contact

For questions, suggestions, or collaboration opportunities, please reach out to the team members or create an issue in this repository.

---

*Making research accessible, one connection at a time.* 🔬✨
