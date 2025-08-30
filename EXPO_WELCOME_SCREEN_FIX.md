# Fixing "Welcome to Expo" Screen Issue

## Problem Description
When running the Expo app, it was stuck showing the "Welcome to Expo" screen instead of loading the actual application. This was caused by the `react-native-dotenv` package configuration issue.

## Root Cause
The `react-native-dotenv` package was causing conflicts with Expo's environment variable handling, preventing the app from properly initializing.

## Solution Overview
Remove `react-native-dotenv` and update all environment variable references to use `process.env` instead of `@env` imports.

---

## Step-by-Step Fix Instructions

### 1. Update `babel.config.js`

**Before:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
```

**After:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo']
  };
};
```

### 2. Remove `react-native-dotenv` from `package.json`

**Remove this line from dependencies:**
```json
"react-native-dotenv": "^3.4.11",
```

### 3. Uninstall the Package

Run this command in your terminal:
```bash
npm uninstall react-native-dotenv
```

### 4. Update Environment Variable Imports

#### A. Update `hooks/useProfile.ts`

**Remove this import:**
```typescript
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';
```

**Update all references from:**
```typescript
if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
```

**To:**
```typescript
if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
```

#### B. Update `services/ocrService.ts`

**Remove this import:**
```typescript
import {
  EXPO_PUBLIC_AZURE_VISION_ENDPOINT,
  AZURE_COMPUTER_VISION_ENDPOINT,
  EXPO_PUBLIC_AZURE_VISION_API_KEY,
  AZURE_COMPUTER_VISION_API_KEY,
} from '@env';
```

**Update all references from:**
```typescript
console.log('EXPO_PUBLIC_AZURE_VISION_ENDPOINT:', EXPO_PUBLIC_AZURE_VISION_ENDPOINT);
console.log('AZURE_COMPUTER_VISION_ENDPOINT:', AZURE_COMPUTER_VISION_ENDPOINT);
console.log('EXPO_PUBLIC_AZURE_VISION_API_KEY:', EXPO_PUBLIC_AZURE_VISION_API_KEY ? '***SET***' : 'NOT SET');
console.log('AZURE_COMPUTER_VISION_API_KEY:', AZURE_COMPUTER_VISION_API_KEY ? '***SET***' : 'NOT SET');

const endpoint = EXPO_PUBLIC_AZURE_VISION_ENDPOINT || AZURE_COMPUTER_VISION_ENDPOINT;
const apiKey = EXPO_PUBLIC_AZURE_VISION_API_KEY || AZURE_COMPUTER_VISION_API_KEY;
```

**To:**
```typescript
console.log('EXPO_PUBLIC_AZURE_VISION_ENDPOINT:', process.env.EXPO_PUBLIC_AZURE_VISION_ENDPOINT);
console.log('AZURE_COMPUTER_VISION_ENDPOINT:', process.env.AZURE_COMPUTER_VISION_ENDPOINT);
console.log('EXPO_PUBLIC_AZURE_VISION_API_KEY:', process.env.EXPO_PUBLIC_AZURE_VISION_API_KEY ? '***SET***' : 'NOT SET');
console.log('AZURE_COMPUTER_VISION_API_KEY:', process.env.AZURE_COMPUTER_VISION_API_KEY ? '***SET***' : 'NOT SET');

const endpoint = process.env.EXPO_PUBLIC_AZURE_VISION_ENDPOINT || process.env.AZURE_COMPUTER_VISION_ENDPOINT;
const apiKey = process.env.EXPO_PUBLIC_AZURE_VISION_API_KEY || process.env.AZURE_COMPUTER_VISION_API_KEY;
```

### 5. Reinstall Dependencies

Run this command to ensure all dependencies are properly installed:
```bash
npm install
```

### 6. Clear Cache and Restart

Start the Expo app with cache clearing:
```bash
npx expo start -c
```

---

## Files Modified

1. **`babel.config.js`** - Removed dotenv plugin
2. **`package.json`** - Removed react-native-dotenv dependency
3. **`hooks/useProfile.ts`** - Updated environment variable references
4. **`services/ocrService.ts`** - Updated environment variable references

---

## Environment Variable Usage

**Before (using @env):**
```typescript
import { EXPO_PUBLIC_SUPABASE_URL } from '@env';
const url = EXPO_PUBLIC_SUPABASE_URL;
```

**After (using process.env):**
```typescript
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

---

## Verification

After implementing these fixes:

1. ✅ Metro Bundler should start successfully
2. ✅ QR code should be displayed (no more "Welcome to Expo" screen)
3. ✅ App should bundle and load properly
4. ✅ Environment variables should be accessible via `process.env.EXPO_PUBLIC_*`

---

## Why This Fix Works

1. **Removes conflicting plugin**: `react-native-dotenv` was interfering with Expo's built-in environment variable handling
2. **Uses standard approach**: `process.env` is the standard way to access environment variables in Expo
3. **Simplifies configuration**: Removes unnecessary complexity from Babel configuration
4. **Maintains functionality**: All environment variables remain accessible, just through a different method

---

## Troubleshooting

If you still see issues:

1. **Clear all caches**: `npx expo start -c`
2. **Delete node_modules**: `rm -rf node_modules && npm install`
3. **Check .env file**: Ensure environment variables are properly set with `EXPO_PUBLIC_` prefix
4. **Restart terminal**: Sometimes environment variables need a fresh terminal session

---

## Notes

- This fix maintains all existing functionality
- Environment variables are still loaded from your `.env` file
- The `EXPO_PUBLIC_` prefix is still required for client-side access
- This approach is more reliable and follows Expo best practices
