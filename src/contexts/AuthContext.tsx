
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loginAsGuest: () => Promise<boolean>;
  loginWithAuthentik: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Middleware backend configuration
const AUTH_API_BASE = 'https://api-get-away.krishnarajthadesar.in';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedUser = localStorage.getItem('auth_user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // Guest users don't need server validation
      if (parsedUser && parsedUser.id.startsWith('guest_')) {
        setUser(parsedUser);
        setIsLoading(false);
        return;
      }

      // Validate session with server for non-guest users (or no stored user)
      try {
        const response = await fetch(`${AUTH_API_BASE}/whoami/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const userData = {
            id: data.sub,
            username: data.name,
          };

          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        } else {
          // Server says not authenticated — clear stale local data
          localStorage.removeItem('auth_user');
        }
      } catch (error) {
        // Network error — trust stored guest user, clear OAuth users
        if (parsedUser && parsedUser.id.startsWith('guest_')) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('auth_user');
        }
        console.log('Auth check failed:', error);
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const loginAsGuest = async (): Promise<boolean> => {
    try {
      // Reuse existing guest ID if available, so data persists across sessions
      const storedUser = localStorage.getItem('auth_user');
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      const guestId = (parsed && parsed.id.startsWith('guest_')) ? parsed.id : 'guest_' + Date.now();

      const userData = {
        id: guestId,
        username: 'Guest User'
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Guest login failed:', error);
      return false;
    }
  };

  const loginWithAuthentik = async (): Promise<boolean> => {
    try {
      // Redirect to middleware backend for authentication
      window.location.href = `${AUTH_API_BASE}/auth/login`;
      return true;
    } catch (error) {
      console.error('Login redirect failed:', error);
      return false;
    }
  };

  const logout = async () => {
    const wasOAuthUser = user && !user.id.startsWith('guest_');

    setUser(null);
    localStorage.removeItem('auth_user');

    // Invalidate server session for OAuth users
    if (wasOAuthUser) {
      try {
        await fetch(`${AUTH_API_BASE}/auth/logout`, {
          credentials: 'include',
        });
      } catch (error) {
        console.warn('Server logout failed:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginAsGuest, loginWithAuthentik, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
