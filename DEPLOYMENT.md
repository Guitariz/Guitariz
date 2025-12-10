# 🚀 Deployment Guide for Guitariz

This guide covers deploying Guitariz to Vercel and other hosting platforms.

## Quick Deploy to Vercel

### Method 1: Via GitHub (Recommended)

1. **Create a GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Guitariz project setup"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/guitariz.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select "Import Git Repository"
   - Paste your repository URL
   - Click "Continue"

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - Leave environment variables empty unless needed

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 1-3 minutes)
   - Your site is live!

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production
vercel --prod
```

## Custom Domain Setup

1. **In Vercel Dashboard**
   - Select your project
   - Go to "Settings" > "Domains"
   - Click "Add Domain"
   - Enter your domain (e.g., guitariz.com)

2. **Update DNS Records** (varies by registrar)
   - Add CNAME record pointing to `cname.vercel.com`
   - Or use Vercel's nameservers

3. **Wait for DNS Propagation** (up to 48 hours)

## Environment Variables

Create a `.env.local` file for local development (not needed for basic setup):

```env
VITE_APP_URL=https://guitariz.vercel.app
```

To add to Vercel:
1. Go to Project Settings > Environment Variables
2. Add your variables
3. Redeploy for changes to take effect

## Alternative Deployment Methods

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify deploy

# Deploy to production
netlify deploy --prod
```

Create a `netlify.toml` file:
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deploy to GitHub Pages

1. **Update vite.config.ts**
```typescript
export default defineConfig({
  base: '/guitariz/', // If deploying to subdirectory
  // ... rest of config
});
```

2. **Deploy**
```bash
npm run build
# Upload dist/ to GitHub Pages
```

### Deploy to Self-Hosted Server

```bash
# Build the project
npm run build

# Upload dist/ folder to your server
scp -r dist/* user@your-server.com:/var/www/guitariz/

# Configure web server (nginx example)
```

**Nginx Configuration**
```nginx
server {
    listen 80;
    server_name guitariz.com;

    location / {
        root /var/www/guitariz;
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Performance Optimization

### Enable Compression
Vercel automatically handles gzip compression.

### Caching Strategy
- Static assets: 1 year cache
- HTML files: No cache (served fresh)
- API responses: Varies by endpoint

### Monitoring
- Check Vercel Analytics
- Monitor performance with Lighthouse
- Use Chrome DevTools for profiling

## Troubleshooting

### Build Fails on Vercel

**Error: TypeScript errors**
```bash
# Ensure types are correct locally
npm run build

# Check for any missing dependencies
npm install
```

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Site Shows 404

- Verify `vercel.json` has correct rewrites
- Check that dist/ folder exists locally
- Clear Vercel cache: Dashboard > Settings > Git > Clear Cache

### Environment Variables Not Working

- Verify they're added to Vercel Project Settings
- Ensure variables are prefixed with `VITE_` for client-side
- Redeploy after adding variables

## Deployment Checklist

- [ ] Update `package.json` with correct name and metadata
- [ ] Remove TODO comments and debug code
- [ ] Test production build locally: `npm run build && npm run preview`
- [ ] Verify all features work in production
- [ ] Update README with live URL
- [ ] Enable analytics (Vercel Web Analytics)
- [ ] Set up custom domain
- [ ] Configure SSL certificate (automatic on Vercel)
- [ ] Set up monitoring/alerts
- [ ] Test on multiple browsers and devices
- [ ] Check mobile responsiveness
- [ ] Verify 404 page works
- [ ] Test keyboard shortcuts
- [ ] Performance test with Lighthouse

## Post-Deployment

### Analytics
- Enable Vercel Web Analytics for traffic insights
- Monitor Core Web Vitals

### Monitoring
- Set up GitHub notifications for errors
- Monitor Vercel Analytics dashboard

### Updates
1. Make changes locally
2. Test: `npm run dev`
3. Build: `npm run build`
4. Commit and push: `git push origin main`
5. Vercel auto-deploys on push!

### Rollback
```bash
# In Vercel Dashboard
# Deployments > Select previous deployment > Click "Rollback"
```

## Security Best Practices

- ✅ Keep dependencies updated: `npm update`
- ✅ Use HTTPS (automatic on Vercel)
- ✅ Set secure headers (configured in vercel.json)
- ✅ Don't commit `.env` files
- ✅ Regular backups of repository
- ✅ Monitor for vulnerabilities: `npm audit`

## Support

For issues with:
- **Vercel**: [Vercel Docs](https://vercel.com/docs)
- **Guitariz**: [GitHub Issues](https://github.com/abhi9vaidya/guitariz/issues)

---

**Happy deploying! 🚀**
