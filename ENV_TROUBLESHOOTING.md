# 🔧 Environment Variables Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### Issue 1: Environment Variables Not Loading

**Symptoms:**
- API keys showing as "NOT SET" in console logs
- "credentials not configured" errors
- Variables are undefined even though they exist in `.env`

**Solutions:**

#### 1. **Check .env File Location**
Make sure your `.env` file is in the **root directory** of your project:
```
finance-tracker-app/
├── .env  ← Should be here
├── package.json
├── app.json
├── services/
└── ...
```

#### 2. **Verify .env File Format**
Your `.env` file should look like this:
```env
# Azure Computer Vision (for OCR)
EXPO_PUBLIC_AZURE_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
EXPO_PUBLIC_AZURE_VISION_API_KEY=your-azure-api-key-here

# OpenAI (for text parsing)
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key-here

# Supabase (if needed)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Important Rules:**
- ✅ No spaces around `=`
- ✅ No quotes around values
- ✅ No trailing spaces
- ✅ Use `EXPO_PUBLIC_` prefix for client-side variables

#### 3. **Restart Development Server**
After making changes to `.env`:
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
# or
expo start --clear
```

#### 4. **Clear Metro Cache**
```bash
npx expo start --clear
# or
npx react-native start --reset-cache
```

### Issue 2: Babel Configuration Problems

**Check if `babel.config.js` exists and is correct:**

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

### Issue 3: TypeScript Declaration Issues

**Make sure `types/env.d.ts` exists:**

```typescript
declare module '@env' {
  export const EXPO_PUBLIC_AZURE_VISION_ENDPOINT: string;
  export const AZURE_COMPUTER_VISION_ENDPOINT: string;
  export const EXPO_PUBLIC_AZURE_VISION_API_KEY: string;
  export const AZURE_COMPUTER_VISION_API_KEY: string;
  export const EXPO_PUBLIC_OPENAI_API_KEY: string;
  export const EXPO_PUBLIC_SUPABASE_URL: string;
  export const EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
}
```

### Issue 4: Import Problems

**Use the correct import syntax:**

```typescript
// ✅ Correct way
import {
  EXPO_PUBLIC_AZURE_VISION_ENDPOINT,
  EXPO_PUBLIC_AZURE_VISION_API_KEY,
  EXPO_PUBLIC_OPENAI_API_KEY,
} from '@env';

// ❌ Wrong way
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
```

## 🔍 **Debugging Steps**

### Step 1: Add Debug Logging
The OCR service now includes debug logging. Check your console for:
```
🔍 Debugging environment variables...
EXPO_PUBLIC_AZURE_VISION_ENDPOINT: https://...
EXPO_PUBLIC_AZURE_VISION_API_KEY: ***SET***
EXPO_PUBLIC_OPENAI_API_KEY: ***SET***
```

### Step 2: Test Environment Variables
Create a simple test component:

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import {
  EXPO_PUBLIC_AZURE_VISION_ENDPOINT,
  EXPO_PUBLIC_OPENAI_API_KEY,
} from '@env';

export default function EnvTest() {
  return (
    <View style={{ padding: 20 }}>
      <Text>Azure Endpoint: {EXPO_PUBLIC_AZURE_VISION_ENDPOINT || 'NOT SET'}</Text>
      <Text>OpenAI Key: {EXPO_PUBLIC_OPENAI_API_KEY ? 'SET' : 'NOT SET'}</Text>
    </View>
  );
}
```

### Step 3: Check File Permissions
Make sure `.env` file is readable:
```bash
# On Unix/Linux/Mac
ls -la .env
# Should show: -rw-r--r--

# On Windows
dir .env
```

## 🛠️ **Alternative Solutions**

### Option 1: Use Expo Constants
If `react-native-dotenv` doesn't work, use Expo Constants:

1. **Install expo-constants** (if not already installed):
```bash
npx expo install expo-constants
```

2. **Update app.json**:
```json
{
  "expo": {
    "extra": {
      "azureEndpoint": process.env.EXPO_PUBLIC_AZURE_VISION_ENDPOINT,
      "azureApiKey": process.env.EXPO_PUBLIC_AZURE_VISION_API_KEY,
      "openaiApiKey": process.env.EXPO_PUBLIC_OPENAI_API_KEY
    }
  }
}
```

3. **Use in code**:
```typescript
import Constants from 'expo-constants';

const azureEndpoint = Constants.expoConfig?.extra?.azureEndpoint;
const azureApiKey = Constants.expoConfig?.extra?.azureApiKey;
```

### Option 2: Use Expo Config Plugin
For more advanced configuration:

1. **Create app.config.js**:
```javascript
export default {
  expo: {
    name: "Finance Tracker",
    // ... other config
    extra: {
      azureEndpoint: process.env.EXPO_PUBLIC_AZURE_VISION_ENDPOINT,
      azureApiKey: process.env.EXPO_PUBLIC_AZURE_VISION_API_KEY,
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    },
  },
};
```

## 🚀 **Quick Fix Checklist**

- [ ] `.env` file exists in root directory
- [ ] `.env` file has correct format (no spaces, no quotes)
- [ ] Variables start with `EXPO_PUBLIC_`
- [ ] `babel.config.js` is configured correctly
- [ ] `types/env.d.ts` exists
- [ ] Development server restarted after changes
- [ ] Metro cache cleared
- [ ] Import uses `@env` not `process.env`

## 🆘 **Still Having Issues?**

1. **Check the console logs** - The debug logging will show exactly what's happening
2. **Verify your API keys** - Make sure they're valid and not expired
3. **Test with a simple variable** - Try adding a simple test variable first
4. **Check for typos** - Variable names are case-sensitive
5. **Restart everything** - Sometimes a full restart is needed

## 📞 **Need More Help?**

If you're still having issues after trying these solutions:

1. Share the console output from the debug logging
2. Share your `.env` file structure (without the actual keys)
3. Share your `babel.config.js` content
4. Let me know what platform you're testing on (iOS/Android/Web)
