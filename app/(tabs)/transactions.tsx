import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { ExchangeRateService } from '@/services/exchangeRateService';
import AuthScreen from '@/components/AuthScreen';
import TransactionModal from '@/components/TransactionModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import Theme from '@/constants/Theme';
import { Database } from '@/types/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction } = useTransactions(user?.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Database['public']['Tables']['transactions']['Row'] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  const handleAddTransaction = async (transactionData: {
    amount: number;
    currency: string;
    category: string;
    type: 'income' | 'expense';
    description: string;
    date: string;
  }) => {
    const { error } = await addTransaction(transactionData);

    if (error) {
      throw new Error(error);
    }
  };

  const handleEditTransaction = async (id: string, updates: {
    amount?: number;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense';
    description?: string | null;
    date?: string;
  }) => {
    const { error } = await updateTransaction(id, updates);

    if (error) {
      throw new Error(error);
    }
  };

  const openEditModal = (transaction: Database['public']['Tables']['transactions']['Row']) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTransaction(id)
        },
      ]
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      
      switch (filterDateRange) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          matchesDate = transactionDate.getMonth() === now.getMonth() && 
                       transactionDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#FFFFFF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.transactionsList}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
          </View>
        )}
        {loading ? (
          <Text style={styles.loadingText}>Loading transactions...</Text>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first transaction'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionCard}
              onPress={() => openEditModal(transaction)}
              onLongPress={() => handleDeleteTransaction(transaction.id)}
            >
              <View style={styles.transactionIcon}>
                {transaction.type === 'income' ? (
                  <TrendingUp size={20} color="#059669" />
                ) : (
                  <TrendingDown size={20} color="#DC2626" />
                )}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionCategory}>
                  {transaction.category}
                </Text>
                <Text style={styles.transactionDescription}>
                  {transaction.description || 'No description'}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.type === 'income' 
                    ? styles.incomeAmount 
                    : styles.expenseAmount
                ]}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {ExchangeRateService.formatCurrency(
                  Math.abs(transaction.amount), 
                  transaction.currency
                )}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddTransaction}
      />

      <EditTransactionModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTransaction(null);
        }}
        onSave={handleEditTransaction}
        transaction={selectedTransaction}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.filterModalContainer}>
          <View style={styles.filterHeader}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.filterTitle}>Filter Transactions</Text>
            <TouchableOpacity 
              onPress={() => {
                setFilterCategory('all');
                setFilterType('all');
                setFilterDateRange('all');
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.clearFilters}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>
                {['all', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Other'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      filterCategory === category && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterCategory(category)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterCategory === category && styles.filterOptionTextActive
                    ]}>
                      {category === 'all' ? 'All Categories' : category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Type</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'all', label: 'All Types' },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expenses' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.filterOption,
                      filterType === type.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterType(type.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterType === type.value && styles.filterOptionTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' }
                ].map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    style={[
                      styles.filterOption,
                      filterDateRange === range.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterDateRange(range.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterDateRange === range.value && styles.filterOptionTextActive
                    ]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: Theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.md,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    ...Theme.cards.card,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.cards.card,
  },
  transactionsList: {
    flex: 1,
    padding: Theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
  },
  loadingText: {
    textAlign: 'center',
    color: Theme.colors.textTertiary,
    padding: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  emptyState: {
    alignItems: 'center',
    padding: Theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  emptySubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.regular,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.error,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.error,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  errorSubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    ...Theme.cards.card,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  transactionDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  transactionDate: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  transactionAmount: {
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  incomeAmount: {
    color: Theme.colors.success,
  },
  expenseAmount: {
    color: Theme.colors.error,
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  filterTitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  clearFilters: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  filterContent: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  filterSection: {
    marginBottom: Theme.spacing['2xl'],
  },
  filterSectionTitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    ...Theme.cards.card,
  },
  filterOptionActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterOptionText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  filterOptionTextActive: {
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.medium,
  },
});