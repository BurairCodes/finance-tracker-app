import { useCallback } from 'react';
import { InsightService } from '@/services/insightService';
import { useAuth } from './useAuth';

export const useInsights = () => {
  const { user } = useAuth();

  // Generate weekly insights
  const generateWeeklyInsights = useCallback(async () => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      await InsightService.generateWeeklyInsights(user.id);
      return { error: null };
    } catch (error) {
      console.error('Failed to generate weekly insights:', error);
      return { error: 'Failed to generate weekly insights' };
    }
  }, [user?.id]);

  // Generate monthly insights
  const generateMonthlyInsights = useCallback(async () => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      await InsightService.generateMonthlyInsights(user.id);
      return { error: null };
    } catch (error) {
      console.error('Failed to generate monthly insights:', error);
      return { error: 'Failed to generate monthly insights' };
    }
  }, [user?.id]);

  // Generate spending pattern insights
  const generateSpendingPatternInsights = useCallback(async () => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      await InsightService.generateSpendingPatternInsights(user.id);
      return { error: null };
    } catch (error) {
      console.error('Failed to generate spending pattern insights:', error);
      return { error: 'Failed to generate spending pattern insights' };
    }
  }, [user?.id]);

  // Schedule recurring insights
  const scheduleInsightsGeneration = useCallback(async () => {
    if (!user?.id) return { error: 'User not authenticated' };

    try {
      await InsightService.scheduleInsightsGeneration(user.id);
      return { error: null };
    } catch (error) {
      console.error('Failed to schedule insights generation:', error);
      return { error: 'Failed to schedule insights generation' };
    }
  }, [user?.id]);

  return {
    generateWeeklyInsights,
    generateMonthlyInsights,
    generateSpendingPatternInsights,
    scheduleInsightsGeneration,
  };
};
