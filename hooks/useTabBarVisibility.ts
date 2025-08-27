import { useAuth } from './useAuth';

export function useTabBarVisibility() {
  const { user, loading } = useAuth();
  
  // Hide tab bar when user is not authenticated or still loading
  return {
    showTabBar: !loading && !!user,
  };
}
