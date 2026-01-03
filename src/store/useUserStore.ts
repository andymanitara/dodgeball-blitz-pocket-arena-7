import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface UserState {
  username: string;
  hairStyle: number;
  isAuthenticated: boolean;
  setProfile: (username: string, hairStyle: number) => void;
  logout: () => void;
}
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: 'Guest',
      hairStyle: 0,
      isAuthenticated: false,
      setProfile: (username, hairStyle) => set({ username, hairStyle, isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'dodgeball-user-storage',
    }
  )
);