import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface UserStats {
  wins: number;
  losses: number;
  matches: number;
}
interface UserState {
  username: string;
  hairStyle: number;
  isAuthenticated: boolean;
  stats: UserStats;
  setProfile: (username: string, hairStyle: number) => void;
  logout: () => void;
  recordMatch: (result: 'win' | 'loss') => void;
}
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: 'Guest',
      hairStyle: 0,
      isAuthenticated: false,
      stats: { wins: 0, losses: 0, matches: 0 },
      setProfile: (username, hairStyle) => set({ username, hairStyle, isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      recordMatch: (result) => set((state) => ({
        stats: {
          matches: state.stats.matches + 1,
          wins: result === 'win' ? state.stats.wins + 1 : state.stats.wins,
          losses: result === 'loss' ? state.stats.losses + 1 : state.stats.losses,
        }
      })),
    }),
    {
      name: 'dodgeball-user-storage',
    }
  )
);