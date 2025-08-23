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
  icon: React.ComponentType<any>;
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
        return <Lightbulb size={16} color="#2563EB" />;
      case 'warning':
        return <AlertTriangle size={16} color="#DC2626" />;
      case 'tip':
        return <Target size={16} color="#059669" />;
      default:
        return <MessageCircle size={16} color="#6B7280" />;
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
                  <insight.icon size={20} color={insight.type === 'warning' ? '#DC2626' : '#059669'} />
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                {insight.action && (
                  <View style={styles.insightAction}>
                    <Text style={styles.actionText}>{insight.action}</Text>
                    <ChevronRight size={16} color="#2563EB" />
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
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  insightsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  insightCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  positiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  tipCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  insightDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  chatSection: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 16,
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
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#2563EB',
  },
  aiMessage: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adviceMessage: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  warningMessage: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tipMessage: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  userMessage: {
    color: 'white',
  },
  aiMessage: {
    color: '#1F2937',
  },
  adviceMessage: {
    color: '#1E40AF',
  },
  warningMessage: {
    color: '#991B1B',
  },
  tipMessage: {
    color: '#166534',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
