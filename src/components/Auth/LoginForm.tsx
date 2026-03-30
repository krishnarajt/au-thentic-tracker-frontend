import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, Key, Sparkles } from 'lucide-react';

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsGuest, loginWithAuthentik } = useAuth();
  const { toast } = useToast();

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginAsGuest();
      if (success) {
        toast({
          title: "Welcome!",
          description: "Logged in as guest user",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to login as guest",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthentikLogin = async () => {
    setIsLoading(true);
    try {
      // This will redirect to Authentik
      await loginWithAuthentik();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate Authentik login",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient gold glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-gold/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-gold/[0.02] rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative animate-scale-in">
        <Card className="glass-card-gold glow-gold overflow-hidden relative">
          {/* Gold accent line at top */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          <CardHeader className="space-y-6 pt-10 pb-4 text-center">
            {/* Logo / Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gold/20 rounded-2xl blur-xl" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-playfair font-bold">
                <span className="text-gold-shimmer">Au</span>
                <span className="text-foreground">thentic</span>
                <span className="text-muted-foreground font-light ml-2 text-xl">Tracker</span>
              </h1>
              <p className="text-sm text-muted-foreground font-inter">
                Your premium gold investment portfolio
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pb-10 px-8">
            {/* Guest Login */}
            <Button
              onClick={handleGuestLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-14 justify-start gap-4 border-gold/15 hover:border-gold/30 hover:bg-gold/5 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-gold/10 group-hover:bg-gold/15 transition-colors">
                <Users className="w-4 h-4 text-gold/70" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm text-foreground">Continue as Guest</div>
                <div className="text-xs text-muted-foreground">Quick access without an account</div>
              </div>
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gold/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-xs uppercase tracking-widest text-muted-foreground/50">or</span>
              </div>
            </div>

            {/* Authentik Login */}
            <Button
              onClick={handleAuthentikLogin}
              disabled={isLoading}
              className="w-full h-14 justify-start gap-4 bg-gradient-to-r from-gold-dark via-gold to-gold-dark hover:from-gold hover:via-gold-light hover:to-gold text-background font-medium shadow-lg shadow-gold/20 hover:shadow-gold/30 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-background/20 group-hover:bg-background/30 transition-colors">
                <Key className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Login with Authentik</div>
                <div className="text-xs opacity-80">Secure OAuth authentication</div>
              </div>
            </Button>

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
                <span className="text-xs text-muted-foreground">Connecting...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subtle branding */}
        <p className="text-center text-xs text-muted-foreground/30 mt-6 font-inter">
          Premium Gold Investment Analytics
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
