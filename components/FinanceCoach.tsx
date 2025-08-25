import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Calendar,
  BarChart3,
  X,
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { AIService } from '@/services/aiService';
import { ExchangeRateService } from '@/services/exchangeRateService';
import Theme from '@/constants/Theme';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'advice' | 'insight' | 'warning' | 'tip';
}

interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'tip';
  icon: React.ComponentType<{ size?: number; color?: string }>;
  action?: string;
}

export default function FinanceCoach() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);

  useEffect(() => {
    generateInitialInsights();
    addWelcomeMessage();
  }, [transactions, budgets]);

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: "Hello! I'm your AI Finance Coach. I can help you with budgeting advice, spending insights, financial tips, and answer any money-related questions. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      type: 'tip'
    };
    setMessages([welcomeMessage]);
  };

  const generateInitialInsights = async () => {
    if (transactions.length === 0) return;

    const currentInsights: FinancialInsight[] = [];
    
    // Analyze spending patterns
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .filter(t => {
        const date = new Date(t.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });

    const totalExpenses = monthlyExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgDailySpending = totalExpenses / new Date().getDate();

    // Spending trend insight
    if (avgDailySpending > 1000) {
      currentInsights.push({
        id: 'high-spending',
        title: 'High Daily Spending',
        description: `You're spending an average of ${ExchangeRateService.formatCurrency(avgDailySpending, 'PKR')} per day this month. Consider reviewing your daily expenses.`,
        type: 'warning',
        icon: TrendingUp,
        action: 'How can I reduce my daily spending?'
      });
    }

    // Budget utilization insight
    const budgetUtilization = budgets.map(budget => {
      const categoryExpenses = monthlyExpenses
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { budget, utilization: (categoryExpenses / budget.amount) * 100 };
    });

    const overBudget = budgetUtilization.find(b => b.utilization > 100);
    if (overBudget) {
      currentInsights.push({
        id: 'over-budget',
        title: 'Budget Exceeded',
        description: `You've exceeded your ${overBudget.budget.category} budget by ${Math.round(overBudget.utilization - 100)}%.`,
        type: 'warning',
        icon: AlertTriangle,
        action: 'How can I get back on track?'
      });
    }

    // Savings opportunity insight
    const income = transactions
      .filter(t => t.type === 'income')
      .filter(t => {
        const date = new Date(t.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const savingsRate = ((income - totalExpenses) / income) * 100;
    if (savingsRate < 20) {
      currentInsights.push({
        id: 'low-savings',
        title: 'Low Savings Rate',
        description: `Your savings rate is ${Math.round(savingsRate)}%. Aim for at least 20% to build wealth.`,
        type: 'tip',
        icon: Target,
        action: 'How can I increase my savings?'
      });
    }

    setInsights(currentInsights);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await AIService.getFinancialAdvice(
        inputText,
        transactions,
        budgets,
        user?.email || ''
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        type: 'advice'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        type: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsightAction = (action: string) => {
    setInputText(action);
    sendMessage();
  };

  const getMessageStyle = (message: Message) => {
    switch (message.type) {
      case 'advice':
        return styles.adviceMessage;
      case 'warning':
        return styles.warningMessage;
      case 'tip':
        return styles.tipMessage;
      default:
        return message.isUser ? styles.userMessage : styles.aiMessage;
    }
  };

  const getMessageIcon = (message: Message) => {
    switch (message.type) {
      case 'advice':
        return <Lightbulb size={16} color={Theme.colors.info} />;
      case 'warning':
        return <AlertTriangle size={16} color={Theme.colors.error} />;
      case 'tip':
        return <Target size={16} color={Theme.colors.success} />;
      default:
        return <MessageCircle size={16} color={Theme.colors.textTertiary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finance Coach</Text>
        <Text style={styles.subtitle}>AI-powered financial advice</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Financial Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Today's Insights</Text>
            {insights.map((insight) => (
              <TouchableOpacity
                key={insight.id}
                style={[styles.insightCard, styles[`${insight.type}Card`]]}
                onPress={() => insight.action && handleInsightAction(insight.action)}
              >
                                 <View style={styles.insightHeader}>
                   <insight.icon size={20} color={insight.type === 'warning' ? Theme.colors.error : Theme.colors.success} />
                   <Text style={styles.insightTitle}>{insight.title}</Text>
                 </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                {insight.action && (
                  <View style={styles.insightAction}>
                    <Text style={styles.actionText}>{insight.action}</Text>
                                         <ChevronRight size={16} color={Theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chat Messages */}
        <View style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Chat with Coach</Text>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
              ]}
            >
              <View style={styles.messageHeader}>
                {!message.isUser && getMessageIcon(message)}
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
                             <View style={[styles.messageBubble, getMessageStyle(message)]}>
                 <Text style={[
                   styles.messageText,
                   message.isUser ? styles.userMessageText : 
                   message.type === 'advice' ? styles.adviceMessageText :
                   message.type === 'warning' ? styles.warningMessageText :
                   message.type === 'tip' ? styles.tipMessageText :
                   styles.aiMessageText
                 ]}>
                   {message.text}
                 </Text>
               </View>
            </View>
          ))}
                     {isLoading && (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="small" color={Theme.colors.primary} />
               <Text style={styles.loadingText}>Coach is thinking...</Text>
             </View>
           )}
        </View>
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your finance coach anything..."
          placeholderTextColor={Theme.colors.textTertiary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.typography.fontSize['2xl'],
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginTop: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  insightsSection: {
    marginBottom: Theme.spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  insightCard: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    ...Theme.cards.card,
  },
  positiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.success,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.error,
  },
  tipCard: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  insightTitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textPrimary,
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  insightDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  actionText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  chatSection: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: Theme.spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  messageTime: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
  },
  userMessage: {
    backgroundColor: Theme.colors.primary,
  },
  aiMessage: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  adviceMessage: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  warningMessage: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  tipMessage: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  messageText: {
    fontSize: Theme.typography.fontSize.sm,
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  userMessageText: {
    color: Theme.colors.textPrimary,
  },
  aiMessageText: {
    color: Theme.colors.textPrimary,
  },
  adviceMessageText: {
    color: Theme.colors.info,
  },
  warningMessageText: {
    color: Theme.colors.error,
  },
  tipMessageText: {
    color: Theme.colors.success,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    marginRight: Theme.spacing.md,
    maxHeight: 100,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    backgroundColor: Theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.textTertiary,
  },
});
