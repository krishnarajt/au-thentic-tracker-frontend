import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Plus, Trash2, TrendingUp, RefreshCw, Calendar, Target, ChevronUp, ChevronDown, ChevronsUpDown, Coins, Wallet, TrendingDown, BarChart3, IndianRupeeIcon, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { goldPurchaseApi, goldPriceApi } from "@/services/goldApi";
import { GoldPurchase } from "@/types/gold";
import { formatCurrency, formatWeight, formatPercentage } from "@/utils/formatters";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { calculateGoldXIRR } from "@/utils/xirr";

type SortField = 'date' | 'grams' | 'amountPaid' | 'pricePerGram' | 'currentValue' | 'return';
type SortDirection = 'asc' | 'desc';

const GoldTracker = () => {
  const [purchases, setPurchases] = useState<GoldPurchase[]>([]);
  const [currentGoldPrice, setCurrentGoldPrice] = useState<number>(0);
  const [lastMonthGoldPrice, setLastMonthGoldPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isLoadingHistoricalPrice, setIsLoadingHistoricalPrice] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [newPurchase, setNewPurchase] = useState({
    grams: "",
    date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Load data on component mount (silent — no toasts)
  useEffect(() => {
    loadPurchases(false);
    fetchCurrentGoldPrice(false);
    fetchLastMonthGoldPrice(false);
  }, []);

  const loadPurchases = async (showToast = true) => {
    setIsLoadingData(true);
    const result = await goldPurchaseApi.getAll();

    if (result.success && result.data) {
      setPurchases(result.data);
      if (showToast) {
        toast({
          title: "Data Loaded",
          description: "Gold purchases loaded from server",
        });
      }
    } else {
      // Keep existing local state if API fails
      console.log("Using local state - API not available");
    }
    setIsLoadingData(false);
  };

  const fetchCurrentGoldPrice = async (showToast = true) => {
    setIsLoadingPrice(true);
    const result = await goldPriceApi.getCurrentPrice();

    if (result.success && result.data) {
      setCurrentGoldPrice(result.data);
      if (showToast) {
        toast({
          title: "Price Updated",
          description: `Current gold price: ₹${result.data.toFixed(2)}/g`,
        });
      }
    } else if (showToast) {
      toast({
        title: "Price Fetch Failed",
        description: "Using manual price input",
        variant: "destructive"
      });
    }
    setIsLoadingPrice(false);
  };

  const fetchLastMonthGoldPrice = async (showToast = true) => {
    setIsLoadingHistoricalPrice(true);
    const result = await goldPriceApi.getHistoricalPrice(30);

    if (result.success && result.data) {
      setLastMonthGoldPrice(result.data);
      if (showToast) {
        toast({
          title: "Historical Price Updated",
          description: `30-day old gold price: ₹${result.data.toFixed(2)}/g`,
        });
      }
    } else if (showToast) {
      toast({
        title: "Historical Price Fetch Failed",
        description: "Please enter manually",
        variant: "destructive"
      });
    }
    setIsLoadingHistoricalPrice(false);
  };

  const addPurchase = async () => {
    if (!newPurchase.grams || !newPurchase.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in grams and date to add a purchase.",
        variant: "destructive"
      });
      return;
    }

    const grams = parseFloat(newPurchase.grams);

    if (isNaN(grams) || grams <= 0) {
      toast({
        title: "Invalid Values",
        description: "Grams must be a positive number.",
        variant: "destructive"
      });
      return;
    }

    // Try to fetch gold price for the selected date, fall back to current price input
    let pricePerGram = currentGoldPrice;
    const priceResult = await goldPriceApi.getPriceAtDate(newPurchase.date);
    if (priceResult.success && priceResult.data) {
      pricePerGram = priceResult.data;
    }

    if (pricePerGram <= 0) {
      toast({
        title: "Missing Price",
        description: "Please enter the current gold price before adding a purchase.",
        variant: "destructive"
      });
      return;
    }
    const amountPaid = grams * pricePerGram;

    const purchaseData = {
      grams,
      amountPaid,
      date: newPurchase.date,
      pricePerGram
    };

    // Try to save to API first
    const result = await goldPurchaseApi.create(purchaseData);

    let purchase: GoldPurchase;
    if (result.success && result.data) {
      purchase = result.data;
      toast({
        title: "Purchase Saved",
        description: `Added ${grams}g of gold at ₹${pricePerGram.toFixed(2)}/g (saved to server)`,
      });
    } else {
      // Fallback to local state
      purchase = {
        id: Date.now().toString(),
        ...purchaseData
      };
      toast({
        title: "Purchase Added Locally",
        description: `Added ${grams}g of gold at ₹${pricePerGram.toFixed(2)}/g (server unavailable)`,
      });
    }

    setPurchases([...purchases, purchase]);
    setNewPurchase({
      grams: "",
      date: new Date().toISOString().split('T')[0]
    });
  };

  const removePurchase = async (id: string) => {
    // Try to delete from API first
    const result = await goldPurchaseApi.delete(id);

    // Update local state regardless of API result
    setPurchases(purchases.filter(p => p.id !== id));

    if (result.success) {
      toast({
        title: "Purchase Removed",
        description: "Gold purchase removed from server",
      });
    } else {
      toast({
        title: "Purchase Removed Locally",
        description: "Gold purchase removed (server unavailable)",
      });
    }
  };

  // Basic calculations
  const totalGrams = purchases.reduce((sum, p) => sum + p.grams, 0);
  const totalInvested = purchases.reduce((sum, p) => sum + p.amountPaid, 0);
  const averagePricePerGram = totalGrams > 0 ? totalInvested / totalGrams : 0;
  const currentValue = totalGrams * currentGoldPrice;
  const totalReturn = currentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // KPI calculations
  const lastMonthValue = totalGrams * lastMonthGoldPrice;
  const monthlyReturn = currentValue - lastMonthValue;
  const monthlyReturnPercentage = lastMonthValue > 0 ? (monthlyReturn / lastMonthValue) * 100 : 0;

  // Get last investment date and calculate returns since then
  const purchasesByDate = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastPurchase = purchasesByDate.length > 0 ? purchasesByDate[0] : null;
  const lastInvestmentDate = lastPurchase ? lastPurchase.date : null;
  const lastInvestmentPrice = lastPurchase ? lastPurchase.pricePerGram : 0;
  // Return since last investment: price change applied to the last purchase's grams only
  const returnSinceLastInvestment = lastPurchase && lastInvestmentPrice > 0
    ? (currentGoldPrice - lastInvestmentPrice) * lastPurchase.grams
    : 0;
  const returnSinceLastInvestmentPercentage = lastInvestmentPrice > 0
    ? ((currentGoldPrice - lastInvestmentPrice) / lastInvestmentPrice) * 100
    : 0;

  // XIRR calculations
  const totalXIRR = calculateGoldXIRR(purchases, currentGoldPrice) * 100;
  // 30-day XIRR: only meaningful if we have both prices
  const monthlyXIRR = (lastMonthGoldPrice > 0 && currentGoldPrice > 0 && totalGrams > 0)
    ? ((currentGoldPrice / lastMonthGoldPrice) ** (365 / 30) - 1) * 100
    : 0;
  // Since last investment XIRR: only uses the last purchase
  const sinceLastInvestmentXIRR = lastPurchase
    ? calculateGoldXIRR([lastPurchase], currentGoldPrice) * 100
    : 0;

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort purchases based on current sort field and direction
  const sortedPurchases = [...purchases].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'grams':
        aValue = a.grams;
        bValue = b.grams;
        break;
      case 'amountPaid':
        aValue = a.amountPaid;
        bValue = b.amountPaid;
        break;
      case 'pricePerGram':
        aValue = a.pricePerGram;
        bValue = b.pricePerGram;
        break;
      case 'currentValue':
        aValue = a.grams * currentGoldPrice;
        bValue = b.grams * currentGoldPrice;
        break;
      case 'return':
        aValue = (a.grams * currentGoldPrice) - a.amountPaid;
        bValue = (b.grams * currentGoldPrice) - b.amountPaid;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Prepare chart data — sort first, then compute cumulative values from the sorted array
  const chronologicalPurchases = [...purchases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = chronologicalPurchases.reduce((acc, purchase, index) => {
    const cumulativeInvested = chronologicalPurchases
      .slice(0, index + 1)
      .reduce((sum, p) => sum + p.amountPaid, 0);
    const cumulativeGrams = chronologicalPurchases
      .slice(0, index + 1)
      .reduce((sum, p) => sum + p.grams, 0);
    const cumulativeValue = cumulativeGrams * currentGoldPrice;
    const cumulativeReturn = cumulativeValue - cumulativeInvested;

    acc.push({
      date: purchase.date,
      invested: cumulativeInvested,
      returns: cumulativeReturn,
      value: cumulativeValue
    });
    return acc;
  }, [] as Array<{ date: string; invested: number; returns: number; value: number }>);

  const chartConfig = {
    invested: {
      label: "Total Invested",
      color: "hsl(var(--chart-1))",
    },
    returns: {
      label: "Total Returns",
      color: "hsl(var(--chart-2))",
    },
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent text-gold/70 hover:text-gold transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />
      )}
    </Button>
  );

  return (
    <div className="min-h-screen bg-luxury p-4 md:p-6 lg:p-8">
      {/* Ambient gold glow at top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto space-y-6 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in-up">
          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-gold animate-pulse-gold" />
              </div>
              <h1 className="text-4xl md:text-5xl font-playfair font-bold">
                <span className="text-gold-shimmer">Au</span>
                <span className="text-foreground">thentic Tracker</span>
              </h1>
            </div>
            <p className="text-muted-foreground font-inter text-sm md:text-base font-light tracking-wide">
              Premium gold investment analytics & portfolio management
            </p>
          </div>

        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Gold */}
          <Card className="glass-card-gold gold-border-glow overflow-hidden relative group" style={{ animationDelay: '0ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 rounded-lg bg-gold/10">
                  <Coins className="w-3.5 h-3.5 text-gold" />
                </div>
                Total Gold
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-gold-shimmer font-playfair">{formatWeight(totalGrams)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {purchases.length} purchase{purchases.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>

          {/* Total Invested */}
          <Card className="glass-card gold-border-glow overflow-hidden relative group" style={{ animationDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 rounded-lg bg-gold/10">
                  <Wallet className="w-3.5 h-3.5 text-gold/80" />
                </div>
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-foreground font-playfair">{formatCurrency(totalInvested)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(averagePricePerGram)}/g
              </div>
            </CardContent>
          </Card>

          {/* Current Value */}
          <Card className="glass-card gold-border-glow overflow-hidden relative group" style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 rounded-lg bg-success/10">
                  <IndianRupeeIcon className="w-3.5 h-3.5 text-success" />
                </div>
                Current Value
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-gold font-playfair">{formatCurrency(currentValue)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                @ {formatCurrency(currentGoldPrice)}/g
              </div>
            </CardContent>
          </Card>

          {/* Total Return */}
          <Card className="glass-card gold-border-glow overflow-hidden relative group" style={{ animationDelay: '300ms' }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${totalReturn >= 0 ? 'from-success/5' : 'from-destructive/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className={`absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent ${totalReturn >= 0 ? 'via-success/40' : 'via-destructive/40'} to-transparent`} />
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <div className={`p-1.5 rounded-lg ${totalReturn >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {totalReturn >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-success" /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                </div>
                Total Return
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className={`text-2xl font-bold flex items-center gap-2 font-playfair ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totalReturn)}
                <span className={`text-sm font-inter font-medium px-2 py-0.5 rounded-full ${totalReturn >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {formatPercentage(returnPercentage)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                XIRR: <span className={totalXIRR >= 0 ? 'text-success' : 'text-destructive'}>{formatPercentage(totalXIRR)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card gold-border-glow overflow-hidden relative group">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 rounded-lg bg-gold/10">
                  <Calendar className="w-3.5 h-3.5 text-gold/80" />
                </div>
                30-Day Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold flex items-center gap-2 font-playfair ${monthlyReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(monthlyReturn)}
                <span className={`text-xs font-inter font-medium px-2 py-0.5 rounded-full ${monthlyReturn >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {formatPercentage(monthlyReturnPercentage)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                XIRR: <span className={monthlyXIRR >= 0 ? 'text-success' : 'text-destructive'}>{formatPercentage(monthlyXIRR)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card gold-border-glow overflow-hidden relative group">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 rounded-lg bg-gold/10">
                  <Target className="w-3.5 h-3.5 text-gold/80" />
                </div>
                Since Last Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold flex items-center gap-2 font-playfair ${returnSinceLastInvestment >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(returnSinceLastInvestment)}
                <span className={`text-xs font-inter font-medium px-2 py-0.5 rounded-full ${returnSinceLastInvestment >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {formatPercentage(returnSinceLastInvestmentPercentage)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {lastInvestmentDate && <span>Since {lastInvestmentDate}</span>}
                {lastInvestmentDate && <span className="mx-1.5">|</span>}
                XIRR: <span className={sinceLastInvestmentXIRR >= 0 ? 'text-success' : 'text-destructive'}>{formatPercentage(sinceLastInvestmentXIRR)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card gold-border-glow overflow-hidden relative group">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 rounded-lg bg-gold/10">
                  <BarChart3 className="w-3.5 h-3.5 text-gold/80" />
                </div>
                Portfolio XIRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold font-playfair ${totalXIRR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(totalXIRR)}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                Annualized Return Rate
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gold Price Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-gold-pulse" />
                Current Gold Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price per gram</label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-sm">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentGoldPrice}
                      onChange={(e) => setCurrentGoldPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Enter current gold price per gram"
                      className="pl-7 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
                    />
                  </div>
                </div>
                <Button
                  onClick={fetchCurrentGoldPrice}
                  disabled={isLoadingPrice}
                  variant="outline"
                  size="sm"
                  className="border-gold/20 hover:bg-gold/10 hover:border-gold/30 text-gold/80 hover:text-gold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingPrice ? 'animate-spin' : ''}`} />
                  {isLoadingPrice ? 'Fetching...' : 'Fetch'}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1">
                Your average: <span className="text-gold/70 font-medium">{formatCurrency(averagePricePerGram)}/g</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold/50" />
                30-Day Historical Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price per gram</label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 text-sm">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={lastMonthGoldPrice}
                      onChange={(e) => setLastMonthGoldPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Enter gold price from 30 days ago"
                      className="pl-7 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
                    />
                  </div>
                </div>
                <Button
                  onClick={fetchLastMonthGoldPrice}
                  disabled={isLoadingHistoricalPrice}
                  variant="outline"
                  size="sm"
                  className="border-gold/20 hover:bg-gold/10 hover:border-gold/30 text-gold/80 hover:text-gold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingHistoricalPrice ? 'animate-spin' : ''}`} />
                  {isLoadingHistoricalPrice ? 'Fetching...' : 'Fetch'}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2.5">
                Used for 30-day return calculations
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card gold-border-glow overflow-hidden relative">
              <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-playfair text-gold/90">Investment vs Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => formatCurrency(value)}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "invested" ? "Total Invested" : "Investment + Returns"
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="invested"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        fill="url(#investedGradient)"
                        dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        name="Total Invested"
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        fill="url(#valueGradient)"
                        dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        name="Investment + Returns"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="glass-card gold-border-glow overflow-hidden relative">
              <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-playfair text-gold/90">Returns Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="returnsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => formatCurrency(value)}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Total Returns"
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="returns"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        fill="url(#returnsGradient)"
                        dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        name="Total Returns"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add New Purchase */}
        <Card className="glass-card-gold gold-border-glow overflow-hidden relative glow-gold-sm">
          <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-playfair text-gold flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grams</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPurchase.grams}
                  onChange={(e) => setNewPurchase({...newPurchase, grams: e.target.value})}
                  placeholder="0.00"
                  className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
                <Input
                  type="date"
                  value={newPurchase.date}
                  onChange={(e) => setNewPurchase({...newPurchase, date: e.target.value})}
                  className="mt-1.5 bg-background/50 border-gold/15 focus:border-gold/40 focus:ring-gold/20 transition-all"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={addPurchase}
                  className="w-full bg-gradient-to-r from-gold-dark via-gold to-gold-dark hover:from-gold hover:via-gold-light hover:to-gold text-background font-semibold shadow-lg shadow-gold/20 hover:shadow-gold/30 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Purchase
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchases Table */}
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-playfair text-gold/90">Purchase History</CardTitle>
              {purchases.length > 0 && (
                <span className="text-xs text-muted-foreground font-inter">
                  {purchases.length} record{purchases.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin text-gold/50" />
                  <span className="text-sm">Loading your portfolio...</span>
                </div>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex flex-col items-center gap-3">
                  <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10">
                    <Coins className="w-8 h-8 text-gold/40" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No purchases recorded yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Add your first gold purchase above to get started</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <div className="min-w-[700px] px-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/10 hover:bg-transparent">
                        <TableHead><SortButton field="date" label="Date" /></TableHead>
                        <TableHead><SortButton field="grams" label="Grams" /></TableHead>
                        <TableHead><SortButton field="amountPaid" label="Amount Paid" /></TableHead>
                        <TableHead><SortButton field="pricePerGram" label="Price/Gram" /></TableHead>
                        <TableHead><SortButton field="currentValue" label="Current Value" /></TableHead>
                        <TableHead><SortButton field="return" label="Return" /></TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPurchases.map((purchase, index) => {
                        const currentValue = purchase.grams * currentGoldPrice;
                        const returnAmount = currentValue - purchase.amountPaid;
                        const returnPercent = purchase.amountPaid > 0 ? (returnAmount / purchase.amountPaid) * 100 : 0;

                        return (
                          <TableRow
                            key={purchase.id}
                            className="border-gold/5 hover:bg-gold/[0.03] transition-colors duration-200 group/row"
                          >
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(purchase.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-medium text-gold/90">{formatWeight(purchase.grams)}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(purchase.amountPaid)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatCurrency(purchase.pricePerGram)}</TableCell>
                            <TableCell className="font-medium text-sm">{formatCurrency(currentValue)}</TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1.5 text-sm font-medium ${returnAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {returnAmount >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {formatCurrency(returnAmount)}
                                <span className={`text-xs px-1.5 py-0.5 rounded-md ${returnAmount >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                                  {formatPercentage(returnPercent)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePurchase(purchase.id)}
                                className="opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoldTracker;
