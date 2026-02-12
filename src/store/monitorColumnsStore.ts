import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type MonitorColumn = {
  id: string;
  name: string;
  usernames: string[];
};

export type MonitorColumnsState = {
  columns: MonitorColumn[];
  addColumn: (column: MonitorColumn) => void;
  removeColumn: (columnId: string) => void;
  addUsernameToColumn: (columnId: string, username: string) => void;
  removeUsernameFromColumn: (columnId: string, username: string) => void;
  renameColumn: (columnId: string, newName: string) => void;
  setColumns: (columns: MonitorColumn[]) => void;
};

export const useMonitorColumnsStore = create<MonitorColumnsState>()(
  persist(
    set => ({
      columns: [],
      addColumn: column => set(state => ({
        columns: [...state.columns, column],
      })),
      removeColumn: columnId => set(state => ({
        columns: state.columns.filter(col => col.id !== columnId),
      })),
      addUsernameToColumn: (columnId, username) => set(state => ({
        columns: state.columns.map(col =>
          col.id === columnId && !col.usernames.includes(username)
            ? { ...col, usernames: [...col.usernames, username] }
            : col,
        ),
      })),
      removeUsernameFromColumn: (columnId, username) => set(state => ({
        columns: state.columns.map(col =>
          col.id === columnId
            ? { ...col, usernames: col.usernames.filter(u => u !== username) }
            : col,
        ),
      })),
      renameColumn: (columnId, newName) => set(state => ({
        columns: state.columns.map(col =>
          col.id === columnId ? { ...col, name: newName } : col,
        ),
      })),
      setColumns: columns => set({ columns }),
    }),
    {
      name: 'monitor-columns-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ columns: state.columns }),
    },
  ),
);
