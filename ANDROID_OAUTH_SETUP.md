# 🤖 Android Google OAuth Setup Guide

This guide is specifically designed for setting up Google OAuth authentication in your **Android React Native** KharchaX finance app.

## 📋 Prerequisites

- Google Cloud Console account
- Supabase project with authentication enabled
- Expo development environment
- Android development setup

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

### 1.3 Create OAuth 2.0 Credentials for Android
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. **Choose "Android" application type**
4. Fill in Android details:
   - Package name: `com.kharchax.app`
   - SHA-1 certificate fingerprint: (we'll get this in the next step)
5. Add authorized redirect URIs:

#### For Android Development:
```
exp+kharchax://expo-development-client
```

#### For Android Production:
```
kharchax://auth/callback
```

6. Copy the Client ID and Client Secret

## 🔑 Step 2: Get Android SHA-1 Certificate Fingerprint

### 2.1 Development Build (Expo Development Client)
```bash
# If using Expo development client
expo fetch:android:hashes
```

### 2.2 Production Build
```bash
# For production APK/AAB
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

### 2.3 Debug Keystore (Default)
```bash
# Default debug keystore location
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Add the SHA-1 fingerprint to your Google Cloud Console OAuth credentials.**

## 🔧 Step 3: Environment Variables Setup

### 3.1 Update your `.env` file:
```env
# Google OAuth Configuration for Android
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_android_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.2 Update `app.config.js`:
```javascript
export default {
  // ... other config
  scheme: "kharchax", // This is crucial for OAuth
  android: {
    package: "com.kharchax.app",
    // ... other android config
  },
  extra: {
    // ... other extra config
    googleOAuthClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  },
};
```

## 🗄️ Step 4: Supabase Configuration

### 4.1 Enable Google Provider
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Enable "Google" provider
4. Add your Google Client ID and Client Secret
5. Add the same redirect URIs you configured in Google Cloud Console

### 4.2 Configure Redirect URLs in Supabase
Add these URLs to your Supabase project settings:

#### Development:
```
exp+kharchax://expo-development-client
```

#### Production:
```
kharchax://auth/callback
```

## 📱 Step 5: Android App Configuration

### 5.1 Verify App Scheme
Make sure your `app.config.js` has the correct scheme:
```javascript
export default {
  // ... other config
  scheme: "kharchax", // Must match OAuth redirect URIs
  // ... rest of config
}
```

### 5.2 Android Package Name
Ensure your Android package name matches:
```javascript
android: {
  package: "com.kharchax.app", // Must match Google Cloud Console
  // ... other android config
}
```

### 5.3 Deep Link Configuration
The app automatically handles deep links for OAuth callbacks using the `kharchax://` scheme.

## 🧪 Step 6: Testing Your Setup

### 6.1 Use the Android OAuth Test Component
1. Import and add the `GoogleOAuthTest` component to your app
2. Run the "Android Test" to verify configuration
3. Check the console for any errors

### 6.2 Development Testing
1. Start your Expo development server
2. Build and install the development client on Android
3. Try signing in with Google
4. Check the console for OAuth flow logs
5. Verify redirect handling

### 6.3 Production Testing
1. Build a production APK/AAB
2. Install on a real Android device
3. Test the OAuth flow
4. Verify redirect handling works

## 🔍 Step 7: Common Android OAuth Issues

### Issue: "Invalid redirect_uri"
- **Solution**: Make sure redirect URIs match exactly between Google Cloud Console, Supabase, and your app
- **Check**: `exp+kharchax://expo-development-client` for development, `kharchax://auth/callback` for production

### Issue: "OAuth consent screen not configured"
- **Solution**: Complete the OAuth consent screen setup in Google Cloud Console
- **Note**: This is required before you can create OAuth credentials

### Issue: "Client ID not found"
- **Solution**: Verify `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set in your `.env` file
- **Check**: The environment variable is properly loaded

### Issue: "SHA-1 fingerprint mismatch"
- **Solution**: Ensure you're using the correct SHA-1 fingerprint for your build type
- **Development**: Use debug keystore SHA-1
- **Production**: Use your production keystore SHA-1

### Issue: "App scheme not working"
- **Solution**: Verify `scheme: "kharchax"` is set in `app.config.js`
- **Check**: The scheme matches your OAuth redirect URIs

## 🔒 Step 8: Security Considerations for Android

### 8.1 Certificate Fingerprints
- Use different SHA-1 fingerprints for development and production
- Never share your production keystore
- Rotate production keys regularly

### 8.2 Environment Variables
- Never commit `.env` files to version control
- Use different Client IDs for development and production
- Store sensitive data securely

### 8.3 OAuth Scopes
- Only request necessary scopes
- Consider using incremental authorization
- Document why each scope is needed

## 📊 Step 9: Monitoring & Debugging

### 9.1 Console Logging
The app includes comprehensive Android OAuth logging:
- Configuration validation
- OAuth URL generation
- Redirect handling
- Android-specific checks
- Error details

### 9.2 Test Component
Use the `GoogleOAuthTest` component to:
- Validate Android configuration
- Test OAuth URL generation
- Debug redirect issues
- Verify environment variables
- Check Android-specific settings

## 🚀 Step 10: Production Deployment

### 10.1 Update Google Cloud Console
1. Add production redirect URI: `kharchax://auth/callback`
2. Use production SHA-1 fingerprint
3. Update OAuth consent screen if needed

### 10.2 Update Supabase
1. Add production redirect URI
2. Verify Google provider settings
3. Test OAuth flow

### 10.3 Build Production APK/AAB
1. Ensure production keystore is configured
2. Build with production environment variables
3. Test OAuth flow on production build

## 📱 Android-Specific Notes

### Development Mode:
- **Redirect URI**: `exp+kharchax://expo-development-client`
- **Build Type**: Expo development client
- **Keystore**: Debug keystore

### Production Mode:
- **Redirect URI**: `kharchax://auth/callback`
- **Build Type**: Production APK/AAB
- **Keystore**: Production keystore

### Package Name:
- **Development**: `com.kharchax.app`
- **Production**: `com.kharchax.app` (same)

### App Scheme:
- **Always**: `kharchax`

## 📚 Additional Resources

- [Google OAuth 2.0 for Android](https://developers.google.com/identity/sign-in/android)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Linking Documentation](https://docs.expo.dev/versions/latest/sdk/linking/)
- [Android Deep Links](https://developer.android.com/training/app-links/deep-linking)

## 🆘 Getting Help

If you encounter issues:

1. Check the console logs for detailed error messages
2. Use the `GoogleOAuthTest` component to validate configuration
3. Verify all redirect URIs match exactly
4. Check that environment variables are properly set
5. Ensure Google Cloud Console and Supabase configurations match
6. Verify SHA-1 fingerprints are correct for your build type

## ✅ Android OAuth Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] Android OAuth 2.0 credentials created
- [ ] SHA-1 certificate fingerprint added
- [ ] Redirect URIs added to Google Cloud Console
- [ ] Environment variables set in `.env`
- [ ] App scheme "kharchax" configured
- [ ] Android package name set to "com.kharchax.app"
- [ ] Supabase Google provider enabled
- [ ] Redirect URIs added to Supabase
- [ ] Configuration tested with `GoogleOAuthTest`
- [ ] OAuth flow tested in development build
- [ ] OAuth flow tested in production build
- [ ] Deep links working on Android device
