import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './LoginForm';
import { Button } from '@/components/ui/button';
import { LogOut, User, Sparkles } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxury flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative inline-flex">
            <Sparkles className="w-10 h-10 text-gold animate-pulse-gold" />
          </div>
          <div>
            <div className="text-lg font-playfair font-medium text-gold/90">Loading</div>
            <div className="text-sm text-muted-foreground mt-1">Checking authentication...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen">
      {/* Premium Navigation Bar */}
      <div className="sticky top-0 z-50 border-b border-gold/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold/70" />
              <span className="text-sm font-playfair text-gold/80 hidden sm:inline">
                Au<span className="text-foreground/60">thentic</span>
              </span>
            </div>
            <div className="h-4 w-px bg-gold/15 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                <User className="w-3 h-3 text-gold/70" />
              </div>
              <span className="text-sm font-medium text-foreground/80">
                {user.username}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground hover:bg-gold/5 transition-all duration-200 gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Sign Out</span>
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
};

export default AuthWrapper;
