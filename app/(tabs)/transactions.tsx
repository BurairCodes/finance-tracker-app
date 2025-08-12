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

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction } = useTransactions(user?.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  const handleAddTransaction = async (transactionData: any) => {
    const { error } = await addTransaction(transactionData);

    if (error) {
      throw new Error(error);
    }
  };

  const handleEditTransaction = async (id: string, updates: any) => {
    const { error } = await updateTransaction(id, updates);

    if (error) {
      throw new Error(error);
    }
  };

  const openEditModal = (transaction: any) => {
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionsList: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 20,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  incomeAmount: {
    color: '#059669',
  },
  expenseAmount: {
    color: '#DC2626',
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  clearFilters: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 30,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  filterOptionTextActive: {
    color: 'white',
    fontFamily: 'Inter-Medium',
  },
});