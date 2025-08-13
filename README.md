<<<<<<< HEAD
# 💰 Finance Tracker App

A comprehensive personal finance management application built with React Native, Expo, and Supabase.

## 🚀 Features

- **📊 Dashboard**: Real-time balance, income/expense tracking, budget alerts
- **💳 Transactions**: Add, edit, delete transactions with categories
- **🎯 Budgets**: Category-based budgets with visual progress indicators
- **📈 Analytics**: Spending insights, trends, and AI-powered anomaly detection
- **🌍 Multi-Currency**: Support for PKR, USD, EUR, GBP, JPY, and more
- **🔔 Notifications**: Budget alerts and smart notifications
- **📱 Cross-Platform**: Works on iOS, Android, and Web

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo SDK 53
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Navigation**: Expo Router
- **Styling**: Custom styles with Inter font
- **State Management**: Custom hooks
- **AI Features**: Smart categorization and anomaly detection

## 👥 Team Collaboration

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm start
   ```

### Environment Setup

Create a `.env` file with:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key
```

### Database Setup

Run the SQL commands in `SETUP.md` in your Supabase SQL editor.

## 📁 Project Structure

```
project/
├── app/                    # Main app screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── transactions.tsx
│   │   ├── budgets.tsx
│   │   ├── analytics.tsx
│   │   └── settings.tsx
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── hooks/                # Custom React hooks
├── services/             # API services
├── constants/            # App constants
├── types/                # TypeScript types
├── utils/                # Utility functions
└── lib/                  # Library configurations
```

## 🤝 Collaboration Guidelines

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new transaction modal"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

### Coding Standards

- **TypeScript**: Use strict typing
- **Components**: Functional components with hooks
- **Styling**: Use StyleSheet for consistency
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: Document complex logic

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Commit Messages

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `style:` - Formatting changes
- `test:` - Adding tests

## 🐛 Known Issues & Fixes

### Recent Fixes Applied
- ✅ Fixed button mapping issues in transactions screen
- ✅ Added comprehensive error handling
- ✅ Improved data validation
- ✅ Added user-friendly error messages

### Common Issues
- **Metro bundler errors**: Clear cache with `npx expo start --clear`
- **Supabase connection**: Check environment variables
- **Package version conflicts**: Run `npm install` to update

## 📱 Testing

### Development Testing
1. **Start the server**: `npm start`
2. **Scan QR code** with Expo Go app
3. **Test all features**:
   - Add/edit/delete transactions
   - Create and manage budgets
   - Check analytics and insights
   - Test error handling

### Manual Testing Checklist
- [ ] User authentication (sign up/sign in)
- [ ] Add new transaction
- [ ] Edit existing transaction
- [ ] Delete transaction
- [ ] Create budget
- [ ] Filter transactions
- [ ] Search functionality
- [ ] Currency conversion
- [ ] Budget alerts
- [ ] Analytics charts

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npm run build:web
```

### Mobile Build
```bash
eas build --platform all
```

## 📞 Team Communication

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code review and discussion
- **Discord/Slack**: Real-time communication
- **Project Board**: Task tracking

### Code Review Process
1. Create Pull Request
2. Request reviews from team members
3. Address feedback and comments
4. Merge after approval

## 🎯 Current Sprint Goals

- [ ] Fix remaining UI bugs
- [ ] Add offline sync improvements
- [ ] Implement data export features
- [ ] Add more analytics charts
- [ ] Improve performance
- [ ] Add unit tests

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Happy coding! 🚀**
=======
# finance-tracker-app
A comprehensive personal finance management app built with React Native, Expo, and Supabase
>>>>>>> 7382b7d086e9817429522ba8a266c4c2f3eb31f8
