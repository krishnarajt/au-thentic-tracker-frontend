import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Calendar, Target, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight,
  Scale, Clock, Hash, Wallet, Coins, Activity, Zap, Sigma, Percent,
  GaugeCircle, Flame, ShieldCheck, Brain, Sparkles, PieChart as PieChartIcon,
  Layers, Timer, Award
} from "lucide-react";
import { formatCurrency, formatWeight, formatPercentage } from "@/utils/formatters";
import { formatNumber } from "@/utils/numbers";
import {
  XAxis, YAxis, ResponsiveContainer, Legend, Area, AreaChart, CartesianGrid,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, RadialBarChart, RadialBar,
  ComposedChart, Tooltip, ReferenceLine
} from "recharts";
import { AnalyticsTabProps } from "./types";
import KpiCard from "./KpiCard";
import PurchaseCalendar from "./PurchaseCalendar";

const GOLD_COLORS = [
  "hsl(45, 90%, 55%)",
  "hsl(35, 80%, 50%)",
  "hsl(25, 70%, 45%)",
  "hsl(50, 85%, 60%)",
  "hsl(40, 75%, 48%)",
  "hsl(30, 65%, 42%)",
  "hsl(55, 80%, 52%)",
];

const chartConfig = {
  invested: { label: "Total Invested", color: "hsl(var(--chart-1))" },
  returns: { label: "Total Returns", color: "hsl(var(--chart-2))" },
  value: { label: "Current Value", color: "hsl(var(--chart-2))" },
  price: { label: "Price/g", color: "hsl(45, 90%, 55%)" },
  grams: { label: "Grams", color: "hsl(var(--chart-3))" },
  amount: { label: "Amount", color: "hsl(var(--chart-4))" },
  ma: { label: "Moving Avg", color: "hsl(var(--chart-5))" },
  count: { label: "Count", color: "hsl(45, 90%, 55%)" },
  cumulative: { label: "Cumulative", color: "hsl(var(--chart-2))" },
};

const AnalyticsTab = ({
  purchases,
  currentGoldPrice,
  totalGrams,
  totalInvested,
  averagePricePerGram,
  currentValue,
  totalReturn,
  monthlyReturn,
  monthlyReturnPercentage,
  monthlyXIRR,
  returnSinceLastInvestment,
  returnSinceLastInvestmentPercentage,
  sinceLastInvestmentXIRR,
  lastInvestmentDate,
  totalXIRR,
  firstPurchaseDate,
  investmentDays,
  highestPricePaid,
  lowestPricePaid,
  largestPurchase,
  smallestPurchase,
  avgPurchaseSize,
  avgInvestmentPerPurchase,
  priceSpread,
  priceSpreadPercentage,
  unrealizedGainPerGram,
}: AnalyticsTabProps) => {
  const chronologicalPurchases = useMemo(
    () => [...purchases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [purchases]
  );

  // ── Chart Data: Cumulative Investment vs Value ──
  const chartData = useMemo(() => {
    return chronologicalPurchases.reduce((acc, purchase, index) => {
      const cumulativeInvested = chronologicalPurchases.slice(0, index + 1).reduce((sum, p) => sum + p.amountPaid, 0);
      const cumulativeGrams = chronologicalPurchases.slice(0, index + 1).reduce((sum, p) => sum + p.grams, 0);
      acc.push({ date: purchase.date, invested: cumulativeInvested, value: cumulativeGrams * currentGoldPrice });
      return acc;
    }, [] as Array<{ date: string; invested: number; value: number }>);
  }, [chronologicalPurchases, currentGoldPrice]);

  // ── Chart Data: Cumulative Gold Weight ──
  const cumulativeWeightData = useMemo(() => {
    let cumGrams = 0;
    return chronologicalPurchases.map(p => {
      cumGrams += p.grams;
      return { date: p.date, grams: cumGrams };
    });
  }, [chronologicalPurchases]);

  // ── Chart Data: Price Per Gram Over Time with Moving Average ──
  const priceOverTimeData = useMemo(() => {
    const window = Math.max(2, Math.floor(chronologicalPurchases.length / 4));
    return chronologicalPurchases.map((p, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = chronologicalPurchases.slice(start, i + 1);
      const ma = slice.reduce((s, x) => s + x.pricePerGram, 0) / slice.length;
      return { date: p.date, price: p.pricePerGram, ma, grams: p.grams };
    });
  }, [chronologicalPurchases]);

  // ── Chart Data: Purchase Size Scatter ──
  const scatterData = useMemo(
    () => purchases.map(p => ({ grams: p.grams, amount: p.amountPaid, price: p.pricePerGram, date: p.date })),
    [purchases]
  );

  // ── Chart Data: Monthly Frequency ──
  const monthlyFrequency = useMemo(() => {
    const map = new Map<string, { month: string; count: number; totalGrams: number; totalAmount: number }>();
    purchases.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = map.get(key);
      if (existing) { existing.count++; existing.totalGrams += p.grams; existing.totalAmount += p.amountPaid; }
      else map.set(key, { month: label, count: 1, totalGrams: p.grams, totalAmount: p.amountPaid });
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [purchases]);

  // ── Chart Data: Day of Week Distribution ──
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    const amounts = new Array(7).fill(0);
    purchases.forEach(p => {
      const day = new Date(p.date).getDay();
      counts[day]++;
      amounts[day] += p.amountPaid;
    });
    return days.map((name, i) => ({ day: name, count: counts[i], amount: amounts[i] }));
  }, [purchases]);

  // ── Chart Data: Price Histogram (buckets) ──
  const priceHistogram = useMemo(() => {
    if (purchases.length === 0) return [];
    const prices = purchases.map(p => p.pricePerGram);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return [{ range: formatCurrency(min), count: purchases.length, midPrice: min }];
    const buckets = Math.min(8, Math.max(3, Math.ceil(Math.sqrt(purchases.length))));
    const step = (max - min) / buckets;
    const histogram: Array<{ range: string; count: number; midPrice: number }> = [];
    for (let i = 0; i < buckets; i++) {
      const lo = min + i * step;
      const hi = lo + step;
      const count = prices.filter(p => (i === buckets - 1 ? p >= lo && p <= hi : p >= lo && p < hi)).length;
      histogram.push({ range: `${formatCurrency(lo)}-${formatCurrency(hi)}`, count, midPrice: (lo + hi) / 2 });
    }
    return histogram;
  }, [purchases]);

  // ── Chart Data: Purchase Size Pie (bucketed) ──
  const purchaseSizePie = useMemo(() => {
    const buckets = [
      { name: "< 1g", min: 0, max: 1 },
      { name: "1-2g", min: 1, max: 2 },
      { name: "2-5g", min: 2, max: 5 },
      { name: "5-10g", min: 5, max: 10 },
      { name: "10g+", min: 10, max: Infinity },
    ];
    return buckets
      .map(b => ({
        name: b.name,
        value: purchases.filter(p => p.grams >= b.min && p.grams < b.max).length,
      }))
      .filter(b => b.value > 0);
  }, [purchases]);

  // ── Chart Data: Radar - Portfolio Health ──
  const radarData = useMemo(() => {
    if (purchases.length === 0) return [];
    const diversificationScore = Math.min(100, (purchases.length / 20) * 100);
    const consistencyScore = (() => {
      if (monthlyFrequency.length < 2) return 50;
      const counts = monthlyFrequency.map(m => m.count);
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const stdDev = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length);
      const cv = mean > 0 ? stdDev / mean : 0;
      return Math.max(0, Math.min(100, (1 - cv) * 100));
    })();
    const returnScore = Math.max(0, Math.min(100, 50 + (totalReturn / Math.max(1, totalInvested)) * 200));
    const dcaScore = (() => {
      if (purchases.length < 2) return 50;
      const prices = purchases.map(p => p.pricePerGram);
      const simpleAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
      return Math.max(0, Math.min(100, averagePricePerGram <= simpleAvg ? 70 + ((simpleAvg - averagePricePerGram) / simpleAvg) * 300 : 70 - ((averagePricePerGram - simpleAvg) / simpleAvg) * 300));
    })();
    const tenureScore = Math.min(100, (investmentDays / 365) * 50);
    return [
      { metric: "Diversification", value: Math.round(diversificationScore) },
      { metric: "Consistency", value: Math.round(consistencyScore) },
      { metric: "Returns", value: Math.round(returnScore) },
      { metric: "DCA Efficiency", value: Math.round(dcaScore) },
      { metric: "Tenure", value: Math.round(tenureScore) },
    ];
  }, [purchases, monthlyFrequency, totalReturn, totalInvested, averagePricePerGram, investmentDays]);

  // ── Chart Data: Radial Bar - Return Gauge ──
  const returnGaugeData = useMemo(() => {
    const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    return [{ name: "Return", value: Math.min(Math.max(returnPct, -50), 100), fill: returnPct >= 0 ? "hsl(142, 70%, 45%)" : "hsl(0, 70%, 50%)" }];
  }, [totalReturn, totalInvested]);

  // ── Advanced Statistics ──
  const stats = useMemo(() => {
    if (purchases.length === 0) return null;
    const prices = purchases.map(p => p.pricePerGram);
    const n = prices.length;
    const mean = prices.reduce((a, b) => a + b, 0) / n;
    const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    // Median
    const sorted = [...prices].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    // Skewness
    const skewness = n >= 3 ? (n / ((n - 1) * (n - 2))) * prices.reduce((a, b) => a + ((b - mean) / stdDev) ** 3, 0) : 0;

    // Kurtosis (excess)
    const kurtosis = n >= 4
      ? ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * prices.reduce((a, b) => a + ((b - mean) / stdDev) ** 4, 0) - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
      : 0;

    // Z-score of current price
    const zScore = stdDev > 0 ? (currentGoldPrice - mean) / stdDev : 0;

    // Gini coefficient of purchase amounts
    const amounts = purchases.map(p => p.amountPaid).sort((a, b) => a - b);
    const totalAmt = amounts.reduce((a, b) => a + b, 0);
    let giniNum = 0;
    amounts.forEach((a, i) => { giniNum += (2 * (i + 1) - n - 1) * a; });
    const gini = totalAmt > 0 && n > 1 ? giniNum / (n * totalAmt) : 0;

    // DCA efficiency: weighted avg vs simple avg
    const simpleAvg = mean;
    const dcaEfficiency = simpleAvg > 0 ? ((simpleAvg - averagePricePerGram) / simpleAvg) * 100 : 0;

    // Sharpe-like ratio (return per unit of price volatility)
    const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    const sharpe = cv > 0 ? returnPct / cv : 0;

    // Purchase velocity (purchases per month)
    const velocity = investmentDays > 0 ? (purchases.length / investmentDays) * 30 : 0;

    // Concentration: Herfindahl index
    const hhi = purchases.reduce((a, p) => a + (p.amountPaid / totalAmt) ** 2, 0);

    // Streak: consecutive months with purchases
    const monthSet = new Set(purchases.map(p => {
      const d = new Date(p.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }));
    const sortedMonths = Array.from(monthSet).sort();
    let maxStreak = 1, currentStreak = 1;
    for (let i = 1; i < sortedMonths.length; i++) {
      const [py, pm] = sortedMonths[i - 1].split('-').map(Number);
      const [cy, cm] = sortedMonths[i].split('-').map(Number);
      const expected = pm === 12 ? `${py + 1}-01` : `${py}-${String(pm + 1).padStart(2, '0')}`;
      if (`${cy}-${String(cm).padStart(2, '0')}` === expected) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else currentStreak = 1;
    }

    // Percentiles
    const p25 = sorted[Math.floor(n * 0.25)];
    const p75 = sorted[Math.floor(Math.min(n - 1, n * 0.75))];
    const iqr = p75 - p25;

    // Cost basis breakdown
    const belowAvg = purchases.filter(p => p.pricePerGram < averagePricePerGram).length;
    const aboveAvg = purchases.length - belowAvg;

    return {
      mean, median, stdDev, cv, skewness, kurtosis, zScore, gini,
      dcaEfficiency, sharpe, velocity, hhi, maxStreak,
      p25, p75, iqr, belowAvg, aboveAvg, returnPct, variance
    };
  }, [purchases, currentGoldPrice, averagePricePerGram, totalInvested, totalReturn, investmentDays]);

  // ── Chart Data: Monthly Returns Waterfall ──
  const monthlyReturnsData = useMemo(() => {
    if (monthlyFrequency.length === 0) return [];
    return monthlyFrequency.map(m => {
      const avgPrice = m.totalAmount / m.totalGrams;
      const returnPct = avgPrice > 0 ? ((currentGoldPrice - avgPrice) / avgPrice) * 100 : 0;
      return { month: m.month, return: returnPct, positive: returnPct >= 0 };
    });
  }, [monthlyFrequency, currentGoldPrice]);

  // ── Chart Data: Cumulative Return % Over Time ──
  const cumulativeReturnData = useMemo(() => {
    let cumInvested = 0;
    let cumGrams = 0;
    return chronologicalPurchases.map(p => {
      cumInvested += p.amountPaid;
      cumGrams += p.grams;
      const cumValue = cumGrams * currentGoldPrice;
      const returnPct = cumInvested > 0 ? ((cumValue - cumInvested) / cumInvested) * 100 : 0;
      return { date: p.date, returnPct };
    });
  }, [chronologicalPurchases, currentGoldPrice]);

  if (purchases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Add some purchases to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Purchase Calendar */}
      <Card className="glass-card gold-border-glow overflow-hidden relative">
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold/80" />
            Purchase Activity
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Gold purchase activity</p>
        </CardHeader>
        <CardContent>
          <PurchaseCalendar purchases={purchases} />
        </CardContent>
      </Card>

      {/* Return KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card gold-border-glow overflow-hidden relative group">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <div className="p-1.5 rounded-lg bg-gold/10"><Calendar className="w-3.5 h-3.5 text-gold/80" /></div>
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
              <div className="p-1.5 rounded-lg bg-gold/10"><Target className="w-3.5 h-3.5 text-gold/80" /></div>
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
              <div className="p-1.5 rounded-lg bg-gold/10"><BarChart3 className="w-3.5 h-3.5 text-gold/80" /></div>
              Portfolio XIRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-playfair ${totalXIRR >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercentage(totalXIRR)}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">Annualized Return Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Advanced Statistical KPIs ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard icon={Sigma} title="Std Deviation" value={formatCurrency(stats.stdDev)} valueClass="text-foreground" subtitle={`CV: ${formatNumber(stats.cv)}%`} />
          <KpiCard icon={Activity} title="Z-Score" value={formatNumber(stats.zScore)} valueClass={stats.zScore > 1 ? 'text-success' : stats.zScore < -1 ? 'text-destructive' : 'text-gold'} subtitle={stats.zScore > 1 ? "Price above normal" : stats.zScore < -1 ? "Price below normal" : "Price in range"} />
          <KpiCard icon={Zap} title="DCA Efficiency" value={`${stats.dcaEfficiency > 0 ? '+' : ''}${formatNumber(stats.dcaEfficiency)}%`} valueClass={stats.dcaEfficiency >= 0 ? 'text-success' : 'text-destructive'} subtitle={stats.dcaEfficiency >= 0 ? "Beating simple avg" : "Below simple avg"} />
          <KpiCard icon={ShieldCheck} title="Sharpe-like" value={formatNumber(stats.sharpe)} valueClass={stats.sharpe > 1 ? 'text-success' : stats.sharpe > 0 ? 'text-gold' : 'text-destructive'} subtitle="Return / Volatility" />
          <KpiCard icon={Percent} title="Gini Coeff" value={formatNumber(stats.gini)} valueClass="text-foreground" subtitle={stats.gini < 0.3 ? "Even distribution" : stats.gini < 0.5 ? "Moderate spread" : "Concentrated"} />
          <KpiCard icon={Flame} title="Max Streak" value={`${stats.maxStreak} mo`} valueClass="text-gold" subtitle="Consecutive months" />
        </div>
      )}

      {/* ── Row 2: More Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard icon={Brain} title="Skewness" value={formatNumber(stats.skewness)} valueClass="text-foreground" subtitle={stats.skewness > 0.5 ? "Right-skewed" : stats.skewness < -0.5 ? "Left-skewed" : "Symmetric"} />
          <KpiCard icon={Layers} title="Kurtosis" value={formatNumber(stats.kurtosis)} valueClass="text-foreground" subtitle={stats.kurtosis > 1 ? "Heavy tails" : stats.kurtosis < -1 ? "Light tails" : "Normal tails"} />
          <KpiCard icon={GaugeCircle} title="Median Price" value={formatCurrency(stats.median)} valueClass="text-foreground" subtitle={`IQR: ${formatCurrency(stats.iqr)}`} />
          <KpiCard icon={Timer} title="Velocity" value={`${formatNumber(stats.velocity)}/mo`} valueClass="text-gold" subtitle="Purchase frequency" />
          <KpiCard icon={Award} title="Below Avg Buys" value={`${stats.belowAvg}/${purchases.length}`} valueClass="text-success" subtitle={`${formatNumber((stats.belowAvg / purchases.length) * 100)}% were bargains`} />
          <KpiCard icon={PieChartIcon} title="HHI" value={formatNumber(stats.hhi)} valueClass="text-foreground" subtitle={stats.hhi < 0.15 ? "Well diversified" : stats.hhi < 0.25 ? "Moderate" : "Concentrated"} />
        </div>
      )}

      {/* Original Detailed KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clock} title="Investment Tenure" value={`${investmentDays} days`} valueClass="text-gold" subtitle={firstPurchaseDate ? `Since ${new Date(firstPurchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No purchases yet'} />
        <KpiCard icon={Hash} title="Total Purchases" value={purchases.length} valueClass="text-foreground" subtitle={`Avg ${formatWeight(avgPurchaseSize)} per purchase`} />
        <KpiCard icon={Wallet} title="Avg Investment" value={formatCurrency(avgInvestmentPerPurchase)} valueClass="text-foreground" subtitle="Per purchase" />
        <KpiCard icon={TrendingUp} iconColor={unrealizedGainPerGram >= 0 ? "text-success" : "text-destructive"} bgColor={unrealizedGainPerGram >= 0 ? "bg-success/10" : "bg-destructive/10"} title="Unrealized Gain/g" value={formatCurrency(unrealizedGainPerGram)} valueClass={unrealizedGainPerGram >= 0 ? 'text-success' : 'text-destructive'} subtitle={`Current: ${formatCurrency(currentGoldPrice)}/g vs Avg: ${formatCurrency(averagePricePerGram)}/g`} />
        <KpiCard icon={ArrowUpRight} iconColor="text-destructive" bgColor="bg-destructive/10" title="Highest Price Paid" value={formatCurrency(highestPricePaid)} valueClass="text-foreground" subtitle="Per gram" />
        <KpiCard icon={ArrowDownRight} iconColor="text-success" bgColor="bg-success/10" title="Lowest Price Paid" value={formatCurrency(lowestPricePaid)} valueClass="text-foreground" subtitle="Per gram" />
        <KpiCard icon={Scale} title="Price Spread" value={formatCurrency(priceSpread)} valueClass="text-foreground" subtitle={`${formatPercentage(priceSpreadPercentage)} range`} />
        <KpiCard icon={Coins} title="Largest Purchase" value={formatWeight(largestPurchase)} valueClass="text-gold" subtitle={`Smallest: ${formatWeight(smallestPurchase)}`} />
      </div>

      {/* ── CHARTS SECTION ── */}

      {/* Row: Portfolio Health Radar + Return Gauge + Purchase Size Pie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Portfolio Health Radar */}
        {radarData.length > 0 && (
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold/80" />
                Portfolio Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.15} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="value" stroke="hsl(45, 90%, 55%)" fill="hsl(45, 90%, 55%)" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip formatter={(value: number) => [`${formatNumber(value)}/100`, "Score"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Return Gauge */}
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
              <GaugeCircle className="w-4 h-4 text-gold/80" />
              Return Gauge
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="60%" outerRadius="90%" data={returnGaugeData} startAngle={180} endAngle={0} barSize={20}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(var(--muted))" }} />
                  <Tooltip formatter={(value: number) => [`${formatNumber(value)}%`, "Return"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className={`text-2xl font-bold font-playfair -mt-8 ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats ? `${formatNumber(stats.returnPct)}%` : '0%'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total Portfolio Return</div>
          </CardContent>
        </Card>

        {/* Purchase Size Pie */}
        {purchaseSizePie.length > 0 && (
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-gold/80" />
                Purchase Size Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={purchaseSizePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                      {purchaseSizePie.map((_, i) => (
                        <Cell key={i} fill={GOLD_COLORS[i % GOLD_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} purchases`, name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Investment vs Value Over Time */}
      {chartData.length > 0 && (
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-playfair text-gold/90">Investment vs Value Over Time</CardTitle>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} labelFormatter={(v) => new Date(v).toLocaleDateString()} formatter={(value: number, name: string) => [formatCurrency(value), name === "invested" ? "Total Invested" : "Investment + Returns"]} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="invested" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#investedGradient)" dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }} name="Total Invested" />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#valueGradient)" dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }} name="Investment + Returns" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Price Per Gram Over Time + Moving Average */}
      {priceOverTimeData.length > 1 && (
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-playfair text-gold/90">Price Per Gram + Moving Average</CardTitle>
            <p className="text-xs text-muted-foreground">Purchase prices with rolling average & current price reference</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={priceOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <ReferenceLine y={currentGoldPrice} stroke="hsl(142, 70%, 45%)" strokeDasharray="5 5" label={{ value: `Current: ${formatCurrency(currentGoldPrice)}`, position: "right", fill: "hsl(142, 70%, 45%)", fontSize: 10 }} />
                  <ReferenceLine y={averagePricePerGram} stroke="hsl(45, 90%, 55%)" strokeDasharray="3 3" label={{ value: `Avg: ${formatCurrency(averagePricePerGram)}`, position: "left", fill: "hsl(45, 90%, 55%)", fontSize: 10 }} />
                  <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name === "price" ? "Price/g" : name === "ma" ? "Moving Avg" : name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="price" fill="hsl(45, 90%, 55%)" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Price/g" barSize={20} />
                  <Line type="monotone" dataKey="ma" stroke="hsl(var(--chart-5))" strokeWidth={2.5} dot={false} name="Moving Avg" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Row: Cumulative Weight + Cumulative Return % */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cumulative Gold Weight */}
        {cumulativeWeightData.length > 0 && (
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <Coins className="w-4 h-4 text-gold/80" />
                Gold Accumulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeWeightData}>
                    <defs>
                      <linearGradient id="gramsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(45, 90%, 55%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(45, 90%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short' })} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${formatNumber(v)}g`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => [formatWeight(value), "Total Gold"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Area type="stepAfter" dataKey="grams" stroke="hsl(45, 90%, 55%)" strokeWidth={2} fill="url(#gramsGradient)" dot={{ fill: "hsl(45, 90%, 55%)", strokeWidth: 0, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Cumulative Return % */}
        {cumulativeReturnData.length > 0 && (
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold/80" />
                Return % Evolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeReturnData}>
                    <defs>
                      <linearGradient id="returnGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short' })} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${formatNumber(v)}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                    <Tooltip formatter={(value: number) => [`${formatNumber(value)}%`, "Return"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Area type="monotone" dataKey="returnPct" stroke="hsl(142, 70%, 45%)" strokeWidth={2} fill="url(#returnGradient)" dot={{ fill: "hsl(142, 70%, 45%)", strokeWidth: 0, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row: Price Histogram + Day of Week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price Histogram */}
        {priceHistogram.length > 0 && (
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold/80" />
                Price Distribution (Histogram)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Frequency of purchase prices per gram</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceHistogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={50} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [`${value} purchases`, "Frequency"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {priceHistogram.map((_, i) => (
                        <Cell key={i} fill={GOLD_COLORS[i % GOLD_COLORS.length]} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Day of Week */}
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold/80" />
              Purchases by Day of Week
            </CardTitle>
            <p className="text-xs text-muted-foreground">When do you buy gold?</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip formatter={(value: number, name: string) => [name === "count" ? `${value} purchases` : formatCurrency(value), name === "count" ? "Purchases" : "Total Spent"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="count" fill="hsl(45, 90%, 55%)" fillOpacity={0.7} radius={[4, 4, 0, 0]} name="Purchases" />
                  <Bar dataKey="amount" fill="hsl(35, 80%, 50%)" fillOpacity={0.5} radius={[4, 4, 0, 0]} name="Total Spent" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Purchase Frequency & Returns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthlyFrequency.length > 0 && (
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold/80" />
                Monthly Purchase Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyFrequency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${formatNumber(v)}g`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="count" fill="hsl(45, 90%, 55%)" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="# Purchases" />
                    <Line yAxisId="right" type="monotone" dataKey="totalGrams" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="Grams Bought" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Cohort Returns */}
        {monthlyReturnsData.length > 0 && (
          <Card className="glass-card gold-border-glow overflow-hidden relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold/80" />
                Return by Purchase Month
              </CardTitle>
              <p className="text-xs text-muted-foreground">How each month's purchases performed</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReturnsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${formatNumber(v)}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                    <Tooltip formatter={(value: number) => [`${formatNumber(value)}%`, "Return"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                      {monthlyReturnsData.map((entry, i) => (
                        <Cell key={i} fill={entry.positive ? "hsl(142, 70%, 45%)" : "hsl(0, 70%, 50%)"} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Purchase Size Scatter Plot */}
      {scatterData.length > 1 && (
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-playfair text-gold/90 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold/80" />
              Purchase Scatter: Grams vs Amount Paid
            </CardTitle>
            <p className="text-xs text-muted-foreground">Each dot is a purchase - see the correlation between size and cost</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                  <XAxis dataKey="grams" name="Grams" tickFormatter={(v) => `${formatNumber(v)}g`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="amount" name="Amount" tickFormatter={(v) => formatCurrency(v)} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number, name: string) => [name === "Grams" ? formatWeight(value) : formatCurrency(value), name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Scatter data={scatterData} fill="hsl(45, 90%, 55%)" fillOpacity={0.8} strokeWidth={1} stroke="hsl(45, 90%, 65%)">
                    {scatterData.map((_, i) => (
                      <Cell key={i} fill={GOLD_COLORS[i % GOLD_COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;
