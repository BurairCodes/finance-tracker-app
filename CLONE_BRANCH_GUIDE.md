# 🚀 How to Clone the Bug Fixes Branch

## 📋 **Quick Start Guide**

This guide will help you clone the specific branch that contains all the multi-currency and receipt scanner bug fixes.

---

## 🎯 **What You'll Get**

This branch contains fixes for:
- ✅ Multi-currency bugs across all screens
- ✅ Receipt scanner database schema issues
- ✅ React Hooks order violations
- ✅ Currency validation improvements
- ✅ Enhanced error handling
- ✅ Comprehensive documentation

---

qct 

## 🔧 **Method 1: Clone and Switch (Recommended)**

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/BurairCodes/finance-tracker-app.git
cd finance-tracker-app
```

### **Step 2: Switch to the Bug Fixes Branch**
```bash
git checkout bug-fixes/multi-currency-and-receipt-scanner
```

### **Step 3: Install Dependencies**
```bash
npm install
# or
yarn install
```

### **Step 4: Start the Development Server**
```bash
npx expo start
```

---

## 🔧 **Method 2: Clone Specific Branch Directly**

### **Step 1: Clone Only the Specific Branch**
```bash
git clone -b bug-fixes/multi-currency-and-receipt-scanner https://github.com/BurairCodes/finance-tracker-app.git
cd finance-tracker-app
```

### **Step 2: Install Dependencies**
```bash
npm install
# or
yarn install
```

### **Step 3: Start the Development Server**
```bash
npx expo start
```

---

## 🔧 **Method 3: If You Already Have the Repository**

### **Step 1: Navigate to Existing Repository**
```bash
cd path/to/your/finance-tracker-app
```

### **Step 2: Fetch Latest Changes**
```bash
git fetch origin
```

### **Step 3: Switch to the Bug Fixes Branch**
```bash
git checkout bug-fixes/multi-currency-and-receipt-scanner
```

### **Step 4: Install/Update Dependencies**
```bash
npm install
# or
yarn install
```

---

## 📱 **Testing the Fixes**

Once you have the branch cloned, test these specific features:

### **1. Multi-Currency Features**
- ✅ Change your base currency in Settings
- ✅ Add transactions in different currencies
- ✅ Check budget calculations with different currencies
- ✅ Verify analytics show correct currency conversions

### **2. Receipt Scanner**
- ✅ Open receipt scanner from dashboard
- ✅ Upload a receipt image
- ✅ Verify OCR extraction works
- ✅ Save transaction successfully (no database errors)

### **3. Dashboard**
- ✅ Check that budget alerts work correctly
- ✅ Verify currency conversions in monthly stats
- ✅ Test FAB (Floating Action Button) functionality

### **4. Budget Screen**
- ✅ Create budgets in different currencies
- ✅ Check spending calculations
- ✅ Verify currency display and conversion

---

## 🐛 **What Was Fixed**

### **Multi-Currency Issues:**
- ❌ **Before**: Missing profile dependencies caused stale data
- ✅ **After**: All screens update when currency changes

- ❌ **Before**: Currency conversion errors crashed the app
- ✅ **After**: Proper error handling with fallbacks

- ❌ **Before**: No currency validation in forms
- ✅ **After**: Full currency validation in all modals

### **Receipt Scanner Issues:**
- ❌ **Before**: Database schema errors prevented saving
- ✅ **After**: Proper database integration works correctly

- ❌ **Before**: Manual object creation with wrong field names
- ✅ **After**: Uses proper hooks for database operations

### **React Hooks Issues:**
- ❌ **Before**: Hooks called after early returns
- ✅ **After**: Proper hooks order following React rules

---

## 📚 **Documentation Files**

The branch includes these documentation files:
- `BUDGET_CURRENCY_FIXES.md` - Budget screen specific fixes
- `COMPREHENSIVE_CURRENCY_FIXES.md` - All multi-currency fixes
- `HOOKS_ERROR_FIX.md` - React Hooks error fix
- `RECEIPT_SCANNER_FIX.md` - Receipt scanner database fix

---

## 🔄 **Switching Between Branches**

### **To Switch Back to Main Branch:**
```bash
git checkout main
```

### **To Switch Back to Bug Fixes Branch:**
```bash
git checkout bug-fixes/multi-currency-and-receipt-scanner
```

### **To See All Available Branches:**
```bash
git branch -a
```

---

## 🚨 **Troubleshooting**

### **If You Get Permission Errors:**
```bash
# Make sure you have access to the repository
# Contact the repository owner if needed
```

### **If Dependencies Fail to Install:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **If Expo Fails to Start:**
```bash
# Clear Expo cache
npx expo start --clear

# Or reset cache completely
npx expo r -c
```

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the documentation files in the branch
2. Look at the commit messages for specific changes
3. Contact the developer who created the fixes

---

## 🎉 **You're All Set!**

Once you've completed these steps, you'll have a working version of the app with all the bug fixes applied. The multi-currency features should work smoothly, and the receipt scanner should save transactions without errors.

Happy coding! 🚀
