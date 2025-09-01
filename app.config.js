export default {
  name: "KharchaX",
  slug: "kharchax",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/kharchax-logo.png",
  scheme: "kharchax",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  owner: "burair",
  platforms: ["ios", "android", "web"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.kharchax.app"
  },
  android: {
    package: "com.kharchax.app",
    adaptiveIcon: {
      foregroundImage: "./assets/images/kharchax-logo.png",
      backgroundColor: "#0F0F23"
    }
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/kharchax-logo.png"
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/kharchax-logo.png",
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
      projectId: "1e5123f1-8c9f-4f8f-84ca-b3cdaefa576c"
    },
    // Environment variables
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
    azureComputerVisionKey: process.env.AZURE_COMPUTER_VISION_API_KEY,
    azureComputerVisionEndpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  },
};
