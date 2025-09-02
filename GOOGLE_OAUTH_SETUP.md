# 🔐 Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your KharchaX finance app.

## 📋 Prerequisites

- Google Cloud Console account
- Supabase project with authentication enabled
- Expo development environment

## 🚀 Step 1: Google Cloud Console Setup

### 1.1 Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 1.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "KharchaX"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `openid`
   - `profile`
   - `email`
5. Add test users (your email addresses)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" for web, "Android" for Android, "iOS" for iOS
4. Add authorized redirect URIs:

#### For Web Development:
```
http://localhost:8081/auth/callback
```

#### For Android Development:
```
exp+kharchax://expo-development-client
```

#### For iOS Development:
```
exp+kharchax://expo-development-client
```

#### For Production Web:
```
https://yourdomain.com/auth/callback
```

#### For Production Mobile:
```
kharchax://auth/callback
```

5. Copy the Client ID and Client Secret

## 🔧 Step 2: Environment Variables Setup

### 2.1 Update your `.env` file:
```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here

# Web Redirect URI (for production web deployment)
EXPO_PUBLIC_WEB_REDIRECT_URI=https://yourdomain.com/auth/callback
```

### 2.2 Update `app.config.js`:
```javascript
extra: {
  // ... other config
  googleOAuthClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  googleOAuthClientSecret: process.env.GOOGLE_CLIENT_SECRET,
}
```

## 🗄️ Step 3: Supabase Configuration

### 3.1 Enable Google Provider
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Enable "Google" provider
4. Add your Google Client ID and Client Secret
5. Add the same redirect URIs you configured in Google Cloud Console

### 3.2 Configure Redirect URLs in Supabase
Add these URLs to your Supabase project settings:

#### Development:
```
exp+kharchax://expo-development-client
http://localhost:8081/auth/callback
```

#### Production:
```
kharchax://auth/callback
https://yourdomain.com/auth/callback
```

## 📱 Step 4: App Configuration

### 4.1 Update App Scheme
Make sure your `app.config.js` has the correct scheme:
```javascript
export default {
  // ... other config
  scheme: "kharchax",
  // ... rest of config
}
```

### 4.2 Test Configuration
Use the `GoogleOAuthTest` component to verify your setup:
1. Import and add the component to your app
2. Run the configuration test
3. Check the console for any errors

## 🧪 Step 5: Testing

### 5.1 Development Testing
1. Start your Expo development server
2. Try signing in with Google
3. Check the console for OAuth flow logs
4. Verify redirect handling

### 5.2 Common Issues & Solutions

#### Issue: "Invalid redirect_uri"
- **Solution**: Make sure redirect URIs match exactly between Google Cloud Console, Supabase, and your app

#### Issue: "OAuth consent screen not configured"
- **Solution**: Complete the OAuth consent screen setup in Google Cloud Console

#### Issue: "Client ID not found"
- **Solution**: Verify `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set in your `.env` file

#### Issue: "Redirect URI mismatch"
- **Solution**: Check that all redirect URIs are added to both Google Cloud Console and Supabase

## 🔒 Step 6: Security Considerations

### 6.1 Environment Variables
- Never commit `.env` files to version control
- Use different Client IDs for development and production
- Rotate Client Secrets regularly

### 6.2 OAuth Scopes
- Only request necessary scopes
- Consider using incremental authorization
- Document why each scope is needed

### 6.3 Redirect URIs
- Use HTTPS for production web
- Validate redirect URIs on the server side
- Implement CSRF protection

## 📊 Step 7: Monitoring & Debugging

### 7.1 Console Logging
The app includes comprehensive logging for OAuth flows:
- Configuration validation
- OAuth URL generation
- Redirect handling
- Error details

### 7.2 Test Component
Use the `GoogleOAuthTest` component to:
- Validate configuration
- Test OAuth URL generation
- Debug redirect issues
- Verify environment variables

## 🚀 Step 8: Production Deployment

### 8.1 Update Redirect URIs
1. Add production redirect URIs to Google Cloud Console
2. Update Supabase configuration
3. Set production environment variables

### 8.2 Environment Variables
Make sure these are set in your production environment:
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_WEB_REDIRECT_URI` (for web)

### 8.3 Testing Production
1. Test OAuth flow in production environment
2. Verify redirect handling works
3. Check error logging and monitoring

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Linking Documentation](https://docs.expo.dev/versions/latest/sdk/linking/)

## 🆘 Getting Help

If you encounter issues:

1. Check the console logs for detailed error messages
2. Use the `GoogleOAuthTest` component to validate configuration
3. Verify all redirect URIs match exactly
4. Check that environment variables are properly set
5. Ensure Google Cloud Console and Supabase configurations match

## ✅ Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs added to Google Cloud Console
- [ ] Environment variables set in `.env`
- [ ] Supabase Google provider enabled
- [ ] Redirect URIs added to Supabase
- [ ] App scheme configured correctly
- [ ] Configuration tested with `GoogleOAuthTest`
- [ ] OAuth flow tested in development
- [ ] Production configuration updated
- [ ] Production OAuth flow tested
