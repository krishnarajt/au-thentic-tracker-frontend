import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, LayoutDashboard, ShoppingCart, LineChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { goldPurchaseApi, goldPriceApi } from "@/services/goldApi";
import { GoldPurchase } from "@/types/gold";
import { toTaxInclusivePrice } from "@/utils/goldPricing";
import { calculateGoldXIRR } from "@/utils/xirr";
import DashboardTab from "./DashboardTab";
import PurchasesTab from "./PurchasesTab";
import AnalyticsTab from "./AnalyticsTab";

const GoldTracker = () => {
  const [purchases, setPurchases] = useState<GoldPurchase[]>([]);
  const [currentGoldPrice, setCurrentGoldPrice] = useState<number>(0);
  const [lastMonthGoldPrice, setLastMonthGoldPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isLoadingHistoricalPrice, setIsLoadingHistoricalPrice] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [newPurchase, setNewPurchase] = useState({
    grams: "",
    date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

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
        toast({ title: "Data Loaded", description: "Gold purchases loaded from server" });
      }
    } else {
      console.log("Using local state - API not available");
    }
    setIsLoadingData(false);
  };

  const fetchCurrentGoldPrice = async (showToast = true) => {
    setIsLoadingPrice(true);
    const result = await goldPriceApi.getCurrentPrice();
    if (result.success && result.data) {
      const taxedPrice = toTaxInclusivePrice(result.data);
      setCurrentGoldPrice(taxedPrice);
      if (showToast) {
        toast({ title: "Price Updated", description: `Current gold price: ₹${taxedPrice.toFixed(2)}/g` });
      }
    } else if (showToast) {
      toast({ title: "Price Fetch Failed", description: "Using manual price input", variant: "destructive" });
    }
    setIsLoadingPrice(false);
  };

  const fetchLastMonthGoldPrice = async (showToast = true) => {
    setIsLoadingHistoricalPrice(true);
    const result = await goldPriceApi.getHistoricalPrice(30);
    if (result.success && result.data) {
      const taxedPrice = toTaxInclusivePrice(result.data);
      setLastMonthGoldPrice(taxedPrice);
      if (showToast) {
        toast({ title: "Historical Price Updated", description: `30-day old gold price: ₹${taxedPrice.toFixed(2)}/g` });
      }
    } else if (showToast) {
      toast({ title: "Historical Price Fetch Failed", description: "Please enter manually", variant: "destructive" });
    }
    setIsLoadingHistoricalPrice(false);
  };

  const addPurchase = async () => {
    if (!newPurchase.grams || !newPurchase.date) {
      toast({ title: "Missing Information", description: "Please fill in grams and date to add a purchase.", variant: "destructive" });
      return;
    }
    const grams = parseFloat(newPurchase.grams);
    if (isNaN(grams) || grams <= 0) {
      toast({ title: "Invalid Values", description: "Grams must be a positive number.", variant: "destructive" });
      return;
    }

    let pricePerGram = currentGoldPrice;
    const priceResult = await goldPriceApi.getPriceAtDate(newPurchase.date);
    if (priceResult.success && priceResult.data) {
      pricePerGram = toTaxInclusivePrice(priceResult.data);
    }
    if (pricePerGram <= 0) {
      toast({ title: "Missing Price", description: "Please enter the current gold price before adding a purchase.", variant: "destructive" });
      return;
    }

    const amountPaid = grams * pricePerGram;
    const purchaseData = { grams, amountPaid, date: newPurchase.date, pricePerGram };
    const result = await goldPurchaseApi.create(purchaseData);

    let purchase: GoldPurchase;
    if (result.success && result.data) {
      purchase = result.data;
      toast({ title: "Purchase Saved", description: `Added ${grams}g of gold at ₹${pricePerGram.toFixed(2)}/g (saved to server)` });
    } else {
      purchase = { id: Date.now().toString(), ...purchaseData };
      toast({ title: "Purchase Added Locally", description: `Added ${grams}g of gold at ₹${pricePerGram.toFixed(2)}/g (server unavailable)` });
    }

    setPurchases([...purchases, purchase]);
    setNewPurchase({ grams: "", date: new Date().toISOString().split('T')[0] });
  };

  const removePurchase = async (id: string) => {
    const result = await goldPurchaseApi.delete(id);
    setPurchases(purchases.filter(p => p.id !== id));
    toast({
      title: result.success ? "Purchase Removed" : "Purchase Removed Locally",
      description: result.success ? "Gold purchase removed from server" : "Gold purchase removed (server unavailable)",
    });
  };

  const updatePurchase = async (id: string, updated: Partial<GoldPurchase>) => {
    const result = await goldPurchaseApi.update(id, updated);
    if (result.success && result.data) {
      setPurchases(purchases.map(p => p.id === id ? result.data! : p));
      toast({ title: "Purchase Updated", description: "Gold purchase updated on server" });
    } else {
      setPurchases(purchases.map(p => p.id === id ? { ...p, ...updated } : p));
      toast({ title: "Purchase Updated Locally", description: "Gold purchase updated (server unavailable)" });
    }
  };

  const importPurchases = async (imported: Omit<GoldPurchase, 'id'>[]) => {
    const created: GoldPurchase[] = [];
    for (const p of imported) {
      const result = await goldPurchaseApi.create(p);
      if (result.success && result.data) {
        created.push(result.data);
      } else {
        created.push({ id: Date.now().toString() + Math.random(), ...p });
      }
    }
    setPurchases(prev => [...prev, ...created]);
    toast({ title: "Import Complete", description: `Imported ${created.length} purchase${created.length !== 1 ? 's' : ''}` });
  };

  // ── Derived calculations ────────────────────────────────────────
  const totalGrams = purchases.reduce((sum, p) => sum + p.grams, 0);
  const totalInvested = purchases.reduce((sum, p) => sum + p.amountPaid, 0);
  const averagePricePerGram = totalGrams > 0 ? totalInvested / totalGrams : 0;
  const currentValue = totalGrams * currentGoldPrice;
  const totalReturn = currentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  const lastMonthValue = totalGrams * lastMonthGoldPrice;
  const monthlyReturn = currentValue - lastMonthValue;
  const monthlyReturnPercentage = lastMonthValue > 0 ? (monthlyReturn / lastMonthValue) * 100 : 0;

  const purchasesByDate = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastPurchase = purchasesByDate.length > 0 ? purchasesByDate[0] : null;
  const lastInvestmentDate = lastPurchase ? lastPurchase.date : null;
  const lastInvestmentPrice = lastPurchase ? lastPurchase.pricePerGram : 0;
  const returnSinceLastInvestment = lastPurchase && lastInvestmentPrice > 0
    ? (currentGoldPrice - lastInvestmentPrice) * lastPurchase.grams : 0;
  const returnSinceLastInvestmentPercentage = lastInvestmentPrice > 0
    ? ((currentGoldPrice - lastInvestmentPrice) / lastInvestmentPrice) * 100 : 0;

  const totalXIRR = calculateGoldXIRR(purchases, currentGoldPrice) * 100;
  const monthlyXIRR = (lastMonthGoldPrice > 0 && currentGoldPrice > 0 && totalGrams > 0)
    ? ((currentGoldPrice / lastMonthGoldPrice) ** (365 / 30) - 1) * 100 : 0;
  const sinceLastInvestmentXIRR = lastPurchase
    ? calculateGoldXIRR([lastPurchase], currentGoldPrice) * 100 : 0;

  const firstPurchaseDate = purchasesByDate.length > 0 ? purchasesByDate[purchasesByDate.length - 1].date : null;
  const investmentDays = firstPurchaseDate
    ? Math.floor((new Date().getTime() - new Date(firstPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const highestPricePaid = purchases.length > 0 ? Math.max(...purchases.map(p => p.pricePerGram)) : 0;
  const lowestPricePaid = purchases.length > 0 ? Math.min(...purchases.map(p => p.pricePerGram)) : 0;
  const largestPurchase = purchases.length > 0 ? Math.max(...purchases.map(p => p.grams)) : 0;
  const smallestPurchase = purchases.length > 0 ? Math.min(...purchases.map(p => p.grams)) : 0;
  const avgPurchaseSize = purchases.length > 0 ? totalGrams / purchases.length : 0;
  const avgInvestmentPerPurchase = purchases.length > 0 ? totalInvested / purchases.length : 0;
  const priceSpread = highestPricePaid - lowestPricePaid;
  const priceSpreadPercentage = lowestPricePaid > 0 ? (priceSpread / lowestPricePaid) * 100 : 0;
  const unrealizedGainPerGram = currentGoldPrice - averagePricePerGram;

  return (
    <div className="min-h-screen bg-luxury p-4 md:p-6 lg:p-8">
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

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-background/60 backdrop-blur border border-gold/10 p-1 w-full sm:w-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:shadow-none gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="purchases" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:shadow-none gap-1.5 text-xs sm:text-sm">
              <ShoppingCart className="w-3.5 h-3.5" />
              Purchases
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:shadow-none gap-1.5 text-xs sm:text-sm">
              <LineChartIcon className="w-3.5 h-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab
              purchases={purchases}
              totalGrams={totalGrams}
              totalInvested={totalInvested}
              averagePricePerGram={averagePricePerGram}
              currentValue={currentValue}
              currentGoldPrice={currentGoldPrice}
              totalReturn={totalReturn}
              returnPercentage={returnPercentage}
              totalXIRR={totalXIRR}
            />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchasesTab
              purchases={purchases}
              currentGoldPrice={currentGoldPrice}
              lastMonthGoldPrice={lastMonthGoldPrice}
              isLoadingPrice={isLoadingPrice}
              isLoadingHistoricalPrice={isLoadingHistoricalPrice}
              isLoadingData={isLoadingData}
              averagePricePerGram={averagePricePerGram}
              newPurchase={newPurchase}
              setNewPurchase={setNewPurchase}
              setCurrentGoldPrice={setCurrentGoldPrice}
              setLastMonthGoldPrice={setLastMonthGoldPrice}
              fetchCurrentGoldPrice={fetchCurrentGoldPrice}
              fetchLastMonthGoldPrice={fetchLastMonthGoldPrice}
              addPurchase={addPurchase}
              removePurchase={removePurchase}
              updatePurchase={updatePurchase}
              importPurchases={importPurchases}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab
              purchases={purchases}
              currentGoldPrice={currentGoldPrice}
              totalGrams={totalGrams}
              totalInvested={totalInvested}
              averagePricePerGram={averagePricePerGram}
              currentValue={currentValue}
              totalReturn={totalReturn}
              monthlyReturn={monthlyReturn}
              monthlyReturnPercentage={monthlyReturnPercentage}
              monthlyXIRR={monthlyXIRR}
              returnSinceLastInvestment={returnSinceLastInvestment}
              returnSinceLastInvestmentPercentage={returnSinceLastInvestmentPercentage}
              sinceLastInvestmentXIRR={sinceLastInvestmentXIRR}
              lastInvestmentDate={lastInvestmentDate}
              totalXIRR={totalXIRR}
              firstPurchaseDate={firstPurchaseDate}
              investmentDays={investmentDays}
              highestPricePaid={highestPricePaid}
              lowestPricePaid={lowestPricePaid}
              largestPurchase={largestPurchase}
              smallestPurchase={smallestPurchase}
              avgPurchaseSize={avgPurchaseSize}
              avgInvestmentPerPurchase={avgInvestmentPerPurchase}
              priceSpread={priceSpread}
              priceSpreadPercentage={priceSpreadPercentage}
              unrealizedGainPerGram={unrealizedGainPerGram}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GoldTracker;
