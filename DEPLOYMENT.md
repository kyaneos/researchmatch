# Deployment Guide

This repository is set up for automatic deployment to GitHub Pages with two separate versions.

## 🚀 Deployment Setup

### Prerequisites
1. Push this repository to GitHub
2. Enable GitHub Pages in repository settings
3. Set up repository secrets for the alpha version (optional)

### GitHub Pages Configuration

1. **Go to your repository on GitHub**
2. **Navigate to Settings → Pages**
3. **Set Source to "GitHub Actions"**
4. **The workflows will automatically deploy on push to main branch**

## 🌐 Live URLs

Once deployed, your applications will be available at:

- **Demo Version**: `https://your-username.github.io/your-repo-name/demo/`
- **Alpha Version**: `https://your-username.github.io/your-repo-name/alpha/`

## 🔧 Environment Variables (Alpha Version)

For the alpha version to work with Supabase, add these secrets in your GitHub repository:

1. **Go to Settings → Secrets and variables → Actions**
2. **Add Repository Secrets:**
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### Without Supabase Configuration
The alpha version will still deploy and run, but will show empty data with warnings in the console about missing database configuration.

## 🔄 Automatic Deployments

The deployment workflows will trigger when:
- You push changes to the `main` branch
- Changes are made to the respective version directories
- The workflow files themselves are modified

## 📁 Deployment Structure

```
GitHub Pages Root
├── demo/          # Demo version (creator-researcher-match-demo)
└── alpha/         # Alpha version (creator-researcher-match-alpha)
```

## 🛠️ Manual Deployment

If you prefer to deploy manually:

### Demo Version
```bash
cd creator-researcher-match-demo
npm install
npm run build
# Upload dist/ contents to your hosting service
```

### Alpha Version
```bash
cd creator-researcher-match-alpha
npm install
# Set environment variables in .env file
npm run build
# Upload dist/ contents to your hosting service
```

## 🔍 Troubleshooting

**Deployment not triggering?**
- Check that you've enabled GitHub Actions in your repository
- Ensure you're pushing to the `main` branch
- Check the Actions tab for any error messages

**Alpha version not working?**
- Make sure you've set up the Supabase environment variables
- Check the browser console for specific error messages
- Verify your Supabase project is configured correctly

**Pages not loading?**
- GitHub Pages can take a few minutes to deploy
- Check that the base URL is correct in your Vite configuration
- Ensure GitHub Pages is enabled in repository settings

## 🎯 Production Considerations

For production deployment:
- Set up proper error monitoring
- Configure custom domain if needed
- Set up database backups for alpha version
- Consider using a proper hosting service for better performance