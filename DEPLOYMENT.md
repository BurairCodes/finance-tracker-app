# 🚀 Deployment Guide - Keep Your App Live

## 📋 Deployment Options Overview

| Platform | Cost | Difficulty | Features | Best For |
|----------|------|------------|----------|----------|
| **Expo EAS** | Free/Paid | Medium | Mobile apps, app stores | Mobile deployment |
| **Netlify** | Free | Easy | Auto-deploy, forms | Web app, static sites |
| **Railway** | Free/Paid | Medium | Full-stack, databases | Complete solutions |
| **Heroku** | Free/Paid | Medium | Full-stack, add-ons | Production apps |

## 📱 Option 1: Expo EAS (Mobile Apps) - RECOMMENDED

### Setup Steps:

1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   eas build:configure
   ```

4. **Build for different platforms**:
   ```bash
   # Android APK
   eas build --platform android
   
   # iOS (requires Apple Developer account)
   eas build --platform ios
   
   # Both platforms
   eas build --platform all
   ```

5. **Submit to app stores**:
   ```bash
   # Android Play Store
   eas submit --platform android
   
   # iOS App Store
   eas submit --platform ios
   ```

## 🌐 Option 2: Netlify (Web Hosting)

### Setup Steps:

1. **Build your app**:
   ```bash
   npm run build:web
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `dist` folder
   - Or connect your GitHub repository

3. **Your app will be live at**: `https://random-name.netlify.app`

### Custom Domain:
- Add your own domain in Netlify settings
- Free SSL certificate included



## 🚂 Option 3: Railway (Full-Stack)

### Setup Steps:

1. **Go to [railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Railway will auto-detect and deploy**
4. **Add environment variables**:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_EXCHANGE_RATE_API_KEY`

## 🐳 Option 4: Docker Deployment

### Create Dockerfile:
```dockerfile
# Create Dockerfile in project root
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build:web

EXPOSE 3000

CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
```

### Deploy with Docker:
```bash
# Build image
docker build -t finance-tracker .

# Run container
docker run -p 3000:3000 finance-tracker
```

## 🔧 Environment Variables Setup

### For All Deployments:
Make sure these environment variables are set:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key
```

### Setting Environment Variables:

**Expo EAS**:
- Go to Project Settings → Environment Variables
- Add each variable

**Netlify**:
- Go to Site Settings → Environment Variables
- Add each variable

**Railway**:
- Go to Project → Variables
- Add each variable

## 📊 Monitoring & Analytics

### Add Analytics:
```bash
# Install analytics
npm install @expo/analytics

# Or use Google Analytics
npm install react-ga
```

### Health Checks:
Create a health check endpoint:
```typescript
// Add to your app
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

## 🔄 Continuous Deployment

### GitHub Actions (Auto-Deploy):
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to EAS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Install EAS CLI
      run: npm install -g @expo/eas-cli
    
    - name: Deploy to EAS
      run: |
        eas login --non-interactive --username ${{ secrets.EXPO_USERNAME }} --password ${{ secrets.EXPO_PASSWORD }}
        eas build --platform all --non-interactive
```

## 🚨 Production Checklist

### Before Going Live:
- [ ] Test all features thoroughly
- [ ] Set up environment variables
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/analytics
- [ ] Test on multiple devices
- [ ] Check performance
- [ ] Set up error tracking
- [ ] Configure backups

### Security Checklist:
- [ ] Environment variables are secure
- [ ] API keys are not exposed
- [ ] HTTPS is enabled
- [ ] CORS is configured properly
- [ ] Input validation is in place

## 💰 Cost Optimization

### Free Tier Limits:
- **Expo EAS**: 30 builds/month (free tier)
- **Netlify**: 100GB bandwidth/month
- **Railway**: $5 credit/month
- **Heroku**: 550-1000 dyno hours/month

### Scaling Tips:
- Use CDN for static assets
- Optimize images and fonts
- Implement caching strategies
- Monitor usage and costs

## 🔧 Troubleshooting

### Common Issues:

**Build Fails**:
```bash
# Clear cache and rebuild
npm run build:web -- --clear
```

**Environment Variables Not Working**:
- Check variable names (must start with `EXPO_PUBLIC_`)
- Restart deployment after adding variables
- Verify in browser console

**Performance Issues**:
- Optimize bundle size
- Use lazy loading
- Implement proper caching

## 📱 Mobile App Store Deployment

### Android Play Store:
1. **Create Google Play Console account**
2. **Build APK/AAB**: `eas build --platform android`
3. **Upload to Play Console**
4. **Fill store listing information**
5. **Submit for review**

### iOS App Store:
1. **Create Apple Developer account ($99/year)**
2. **Build iOS app**: `eas build --platform ios`
3. **Upload to App Store Connect**
4. **Fill store listing information**
5. **Submit for review**

## 🎯 Recommended Deployment Strategy

### For Development Team:
1. **Mobile**: Use Expo EAS for testing builds
2. **Database**: Keep Supabase (free tier)
3. **Monitoring**: Add basic analytics

### For Production:
1. **Mobile**: App Store deployment
2. **Database**: Supabase Pro
3. **Monitoring**: Full analytics suite

---

## 🚀 Quick Start Commands

```bash
# Build for mobile
eas build --platform all

# Submit to app stores
eas submit --platform android
eas submit --platform ios

# Start development server
npm start
```

---

**Your app will be live and accessible to users worldwide! 🌍**
