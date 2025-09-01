export default {
  expo: {
    name: "Finance Tracker",
    slug: "finance-tracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "finance-tracker",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    platforms: [
      "ios",
      "android",
      "web"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.financetracker.app"
    },
    android: {
      package: "com.financetracker.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#0F0F23"
      }
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#8B5CF6"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "aa5efeca-56a1-4d5e-bdf6-1832f39104e4"
      },
      // Environment variables for API keys - these will be populated from .env
      googleAiApiKey: process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY || null,
      azureComputerVisionKey: process.env.AZURE_COMPUTER_VISION_API_KEY || null,
      azureComputerVisionEndpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT || null,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || null,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null,
    },
  },
};
