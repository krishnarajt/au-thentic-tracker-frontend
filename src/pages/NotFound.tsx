import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-luxury flex items-center justify-center p-4">
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center space-y-6 animate-fade-in-up relative">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10">
            <Sparkles className="w-8 h-8 text-gold/40" />
          </div>
        </div>
        <div>
          <h1 className="text-6xl font-playfair font-bold text-gold-shimmer">404</h1>
          <p className="text-muted-foreground mt-3 text-sm">This page doesn't exist</p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-gold/20 hover:border-gold/30 hover:bg-gold/5 text-gold/80 hover:text-gold"
        >
          <a href="/">Return to Portfolio</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
