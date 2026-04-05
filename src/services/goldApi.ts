
import { GoldPurchase } from '@/types/gold';

// Configuration - update these URLs to point to your NAS backend
const API_BASE_URL = 'https://api-get-away.krishnarajthadesar.in/api/authentic-tracker';

// Helper function to get user ID
const getUserId = () => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user).id : null;
};

const isGuest = () => {
  const userId = getUserId();
  return userId && userId.startsWith('guest_');
};

const GUEST_PURCHASES_KEY = 'guest_gold_purchases';

const getGuestPurchases = (): GoldPurchase[] => {
  const data = localStorage.getItem(GUEST_PURCHASES_KEY);
  return data ? JSON.parse(data) : [];
};

const saveGuestPurchases = (purchases: GoldPurchase[]) => {
  localStorage.setItem(GUEST_PURCHASES_KEY, JSON.stringify(purchases));
};

const normalizePurchase = (purchase: GoldPurchase): GoldPurchase => ({
  ...purchase,
  description: purchase.description ?? '',
});

const normalizePurchaseInput = <T extends Partial<GoldPurchase>>(purchase: T): T & { description: string } => ({
  ...purchase,
  description: purchase.description ?? '',
});

const normalizePurchasePatch = (purchase: Partial<GoldPurchase>): Partial<GoldPurchase> => (
  'description' in purchase
    ? { ...purchase, description: purchase.description ?? '' }
    : purchase
);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Gold Purchase CRUD Operations
export const goldPurchaseApi = {
  // Get all purchases for a user
  getAll: async (): Promise<ApiResponse<GoldPurchase[]>> => {
    if (isGuest()) {
      return { success: true, data: getGuestPurchases().map(normalizePurchase) };
    }
    try {
      const userId = getUserId();
      const url = userId ? `${API_BASE_URL}/gold-purchases?userId=${userId}` : `${API_BASE_URL}/gold-purchases`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.map(normalizePurchase) };
    } catch (error) {
      console.warn('Failed to fetch purchases from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Create new purchase
  create: async (purchase: Omit<GoldPurchase, 'id'>): Promise<ApiResponse<GoldPurchase>> => {
    const normalizedPurchase = normalizePurchaseInput(purchase);
    if (isGuest()) {
      const newPurchase: GoldPurchase = { id: Date.now().toString(), ...normalizedPurchase };
      const purchases = getGuestPurchases();
      purchases.push(newPurchase);
      saveGuestPurchases(purchases);
      return { success: true, data: newPurchase };
    }
    try {
      const userId = getUserId();
      const purchaseWithUser = userId ? { ...normalizedPurchase, userId } : normalizedPurchase;

      const response = await fetch(`${API_BASE_URL}/gold-purchases`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseWithUser),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: normalizePurchase(data) };
    } catch (error) {
      console.warn('Failed to create purchase via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update purchase
  update: async (id: string, purchase: Partial<GoldPurchase>): Promise<ApiResponse<GoldPurchase>> => {
    const normalizedPurchase = normalizePurchasePatch(purchase);
    if (isGuest()) {
      const purchases = getGuestPurchases();
      const index = purchases.findIndex(p => p.id === id);
      if (index === -1) return { success: false, error: 'Purchase not found' };
      purchases[index] = normalizePurchase({ ...purchases[index], ...normalizedPurchase });
      saveGuestPurchases(purchases);
      return { success: true, data: purchases[index] };
    }
    try {
      const userId = getUserId();
      const purchaseWithUser = userId ? { ...normalizedPurchase, userId } : normalizedPurchase;

      const response = await fetch(`${API_BASE_URL}/gold-purchases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseWithUser),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: normalizePurchase(data) };
    } catch (error) {
      console.warn('Failed to update purchase via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete purchase
  delete: async (id: string): Promise<ApiResponse<void>> => {
    if (isGuest()) {
      const purchases = getGuestPurchases().filter(p => p.id !== id);
      saveGuestPurchases(purchases);
      return { success: true };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/gold-purchases/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.warn('Failed to delete purchase via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// Gold Price API
export const goldPriceApi = {
  getCurrentPrice: async (): Promise<ApiResponse<number>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/gold-price`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.pricePerGram };
      }

      return { success: false, error: `HTTP error! status: ${response.status}` };
    } catch (error) {
      console.warn('Failed to fetch gold price from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  getHistoricalPrice: async (daysBack: number): Promise<ApiResponse<number>> => {
    try {
      // Try your custom API first
      try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysBack);
        const dateStr = targetDate.toISOString().split('T')[0];

        const response = await fetch(`${API_BASE_URL}/gold-price/historical?date=${dateStr}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.pricePerGram };
        }
      } catch (error) {
        console.warn('Custom historical gold price API failed:', error);
      }

      // For now, return a fallback (you can enhance this with a real historical API)
      return { success: false, error: 'Historical price API not available' };
    } catch (error) {
      console.warn('Failed to fetch historical gold price from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  getPriceAtDate: async (date: string): Promise<ApiResponse<number>> => {
    try {
      // Try your custom API first
      try {
        const response = await fetch(`${API_BASE_URL}/gold-price/historical?date=${date}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.pricePerGram };
        }
      } catch (error) {
        console.warn('Custom historical gold price API failed for date:', date, error);
      }

      // For now, return a fallback (you can enhance this with a real historical API)
      return { success: false, error: 'Historical price API not available' };
    } catch (error) {
      console.warn('Failed to fetch gold price for date from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// Settings API (for storing user preferences like currency, etc.)
export const settingsApi = {
  get: async (): Promise<ApiResponse<{ currency: string; autoFetchPrice: boolean }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Failed to fetch settings from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  update: async (settings: { currency?: string; autoFetchPrice?: boolean }): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.warn('Failed to update settings via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
