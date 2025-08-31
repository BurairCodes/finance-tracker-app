import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Calendar, CreditCard, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react-native';
import { Bill } from '@/services/billReminderService';
import { ExchangeRateService } from '@/services/exchangeRateService';
import Theme from '@/constants/Theme';

interface BillsListProps {
  bills: Bill[];
  onMarkAsPaid: (billId: string) => Promise<void>;
  onDelete: (billId: string) => Promise<void>;
  profileCurrency?: string;
}

export default function BillsList({ bills, onMarkAsPaid, onDelete, profileCurrency }: BillsListProps) {
  const getBillStatus = (bill: Bill) => {
    const dueDate = new Date(bill.due_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (bill.paid) {
      return { status: 'paid', color: Theme.colors.success, icon: CheckCircle, text: 'Paid' };
    } else if (daysUntilDue < 0) {
      return { status: 'overdue', color: Theme.colors.error, icon: AlertTriangle, text: 'Overdue' };
    } else if (daysUntilDue <= 3) {
      return { status: 'due-soon', color: Theme.colors.warning, icon: AlertTriangle, text: 'Due Soon' };
    } else {
      return { status: 'upcoming', color: Theme.colors.info, icon: Calendar, text: 'Upcoming' };
    }
  };

  const handleMarkAsPaid = (bill: Bill) => {
    Alert.alert(
      'Mark as Paid',
      `Mark "${bill.name}" as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark as Paid', 
          style: 'default',
          onPress: () => onMarkAsPaid(bill.id)
        },
      ]
    );
  };

  const handleDelete = (bill: Bill) => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${bill.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(bill.id)
        },
      ]
    );
  };

  if (bills.length === 0) {
    return (
      <View style={styles.emptyState}>
        <CreditCard size={48} color={Theme.colors.textTertiary} />
        <Text style={styles.emptyText}>No bills created</Text>
        <Text style={styles.emptySubtext}>
          Create bills to track your upcoming payments
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {bills.map((bill) => {
        const { status, color, icon: StatusIcon, text: statusText } = getBillStatus(bill);
        const dueDate = new Date(bill.due_date);
        const formattedDueDate = dueDate.toLocaleDateString();

        return (
          <View key={bill.id} style={styles.billCard}>
            <View style={styles.billHeader}>
              <View style={styles.billInfo}>
                <Text style={styles.billName}>{bill.name}</Text>
                <Text style={styles.billCategory}>{bill.category}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
                <StatusIcon size={16} color={color} />
                <Text style={[styles.statusText, { color }]}>{statusText}</Text>
              </View>
            </View>

            <View style={styles.billDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  {ExchangeRateService.formatCurrency(bill.amount, bill.currency)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>{formattedDueDate}</Text>
              </View>

              {bill.recurring && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>Recurring</Text>
                </View>
              )}

              {bill.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{bill.notes}</Text>
                </View>
              )}
            </View>

            <View style={styles.billActions}>
              {!bill.paid && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.markPaidButton]}
                  onPress={() => handleMarkAsPaid(bill)}
                >
                  <CheckCircle size={16} color={Theme.colors.success} />
                  <Text style={[styles.actionButtonText, { color: Theme.colors.success }]}>
                    Mark as Paid
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(bill)}
              >
                <Trash2 size={16} color={Theme.colors.error} />
                <Text style={[styles.actionButtonText, { color: Theme.colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: Theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  emptySubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.regular,
  },
  billCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.cards.card,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  billCategory: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    gap: Theme.spacing.xs,
  },
  statusText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  billDetails: {
    marginBottom: Theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  detailLabel: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  detailValue: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  billActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    gap: Theme.spacing.xs,
  },
  markPaidButton: {
    borderColor: Theme.colors.success,
    backgroundColor: `${Theme.colors.success}10`,
  },
  deleteButton: {
    borderColor: Theme.colors.error,
    backgroundColor: `${Theme.colors.error}10`,
  },
  actionButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
});
