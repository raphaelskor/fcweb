import { create } from 'zustand';
import { Client } from '@/lib/types';

interface ClientStore {
  /** All clients fetched so far, keyed by id for O(1) lookup */
  clientsCache: Record<string, Client>;
  /** The current page's ordered list of clients */
  currentPageClients: Client[];
  totalPages: number;
  currentPage: number;
  setPageData: (clients: Client[], page: number) => void;
  setTotalPages: (total: number) => void;
  getClientById: (id: string) => Client | undefined;
  clearCache: () => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clientsCache: {},
  currentPageClients: [],
  totalPages: 1,
  currentPage: 1,

  setPageData: (clients, page) => {
    // Merge new clients into the cache
    const newEntries: Record<string, Client> = {};
    for (const c of clients) {
      newEntries[c.id] = c;
    }
    set((state) => ({
      clientsCache: { ...state.clientsCache, ...newEntries },
      currentPageClients: clients,
      currentPage: page,
    }));
  },

  setTotalPages: (total) => set({ totalPages: total }),

  getClientById: (id) => get().clientsCache[id],

  clearCache: () =>
    set({ clientsCache: {}, currentPageClients: [], totalPages: 1, currentPage: 1 }),
}));
