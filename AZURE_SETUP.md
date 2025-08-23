# Azure Computer Vision API Setup Guide

This guide will help you set up Azure Computer Vision API for the receipt scanner feature in your Finance Tracker app.

## 🚀 Quick Start

### 1. Create Azure Account
- Go to [Azure Portal](https://portal.azure.com)
- Sign up for a free account (includes $200 credit for 30 days)
- **Free Tier**: 5,000 transactions/month for Computer Vision

### 2. Create Computer Vision Resource
1. In Azure Portal, click "Create a resource"
2. Search for "Computer Vision"
3. Select "Computer Vision" and click "Create"
4. Fill in the details:
   - **Subscription**: Choose your subscription
   - **Resource Group**: Create new or use existing
   - **Region**: Choose closest to you
   - **Name**: `finance-tracker-vision` (or your preferred name)
   - **Pricing Tier**: **Free (F0)** - 5,000 transactions/month
5. Click "Review + create" then "Create"

### 3. Get API Credentials
1. Go to your Computer Vision resource
2. In the left menu, click "Keys and Endpoint"
3. Copy **Key 1** and **Endpoint URL**
4. You'll need these for environment variables

## 🔧 Environment Variables

Add these to your `.env` file:

```env
AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_API_KEY=your-api-key-here
```

## 📱 Mobile App Configuration

### For React Native (Expo)
1. Create a `.env` file in your project root
2. Add the environment variables above
3. Install `react-native-dotenv` if not already installed:
   ```bash
   npm install react-native-dotenv
   ```
4. Configure in `babel.config.js`:
   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         ['module:react-native-dotenv', {
           moduleName: '@env',
           path: '.env',
         }]
       ]
     };
   };
   ```

## 🔒 Security Best Practices

### ✅ Do's:
- Use environment variables for API keys
- Keep API keys secure and never commit them to version control
- Use the free tier for development and testing
- Monitor usage in Azure Portal

### ❌ Don'ts:
- Hardcode API keys in your source code
- Share API keys publicly
- Exceed free tier limits without monitoring

## 💰 Pricing

### Free Tier (F0):
- **5,000 transactions/month**
- **OCR (Read API)**: 5,000 calls/month
- **Perfect for development and small apps**

### Standard Tier (S1):
- **Pay per transaction**
- **$1.50 per 1,000 transactions**
- **Unlimited usage**

## 🧪 Testing Your Setup

1. Start your app
2. Go to the Receipt Scanner
3. Select a receipt image
4. Check the console logs for:
   ```
   Azure Computer Vision extracted text: [extracted text]
   ```
5. If you see mock data, check your environment variables

## 🔍 Troubleshooting

### Common Issues:

**"Azure Computer Vision credentials not configured"**
- Check your `.env` file
- Verify environment variable names
- Restart your development server

**"Error initializing Azure Computer Vision client"**
- Verify your API key is correct
- Check your endpoint URL format
- Ensure your Azure resource is active

**"No text detected in image"**
- Try a clearer, higher resolution image
- Ensure the image contains readable text
- Check if the image format is supported (JPEG, PNG, BMP, TIFF)

**"Falling back to mock data"**
- This is normal if Azure is not configured
- The app will work with demo data
- Check your API credentials if you want real OCR

## 📊 Usage Monitoring

Monitor your usage in Azure Portal:
1. Go to your Computer Vision resource
2. Click "Metrics" in the left menu
3. Track "Calls" and "Errors"
4. Set up alerts for usage limits

## 🚀 Next Steps

Once Azure is configured:
1. Test with real receipt images
2. Monitor accuracy and adjust parsing logic
3. Consider upgrading to paid tier if needed
4. Implement error handling for API limits

## 📞 Support

- **Azure Documentation**: [Computer Vision API](https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/)
- **Azure Support**: Available in Azure Portal
- **Community**: Stack Overflow, GitHub Issues

---

**Note**: The app will fall back to mock data if Azure credentials are not configured, so you can test the feature immediately while setting up Azure.
