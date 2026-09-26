import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WorkspaceTabsState {
  tabPaths: string[];
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  closeOthers: (path: string) => void;
  closeToRight: (path: string) => void;
  closeAll: (fallbackPath?: string) => void;
  setTabPaths: (paths: string[]) => void;
}

export const useWorkspaceTabsStore = create<WorkspaceTabsState>()(
  persist(
    (set, get) => ({
      tabPaths: [],

      openTab: (path: string) => {
        if (!path || path === "/login") return;
        const current = get().tabPaths;
        if (current.includes(path)) return;
        set({ tabPaths: [...current, path] });
      },

      closeTab: (path: string) => {
        const current = get().tabPaths;
        if (current.length <= 1) return;
        set({ tabPaths: current.filter((p) => p !== path) });
      },

      closeOthers: (path: string) => {
        set({ tabPaths: [path] });
      },

      closeToRight: (path: string) => {
        const current = get().tabPaths;
        const index = current.indexOf(path);
        if (index !== -1) {
          set({ tabPaths: current.slice(0, index + 1) });
        }
      },

      closeAll: (fallbackPath?: string) => {
        const current = get().tabPaths;
        if (fallbackPath) {
          set({ tabPaths: [fallbackPath] });
        } else if (current.length > 0) {
          set({ tabPaths: [current[0]] });
        }
      },

      setTabPaths: (paths: string[]) => {
        set({ tabPaths: paths });
      },
    }),
    {
      name: "admin:workspace-tabs",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
