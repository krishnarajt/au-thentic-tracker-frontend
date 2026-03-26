import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Calendar, Target, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, Scale, Clock, Hash, Wallet, Coins } from "lucide-react";
import { formatCurrency, formatWeight, formatPercentage } from "@/utils/formatters";
import { XAxis, YAxis, ResponsiveContainer, Legend, Area, AreaChart, CartesianGrid } from "recharts";
import { AnalyticsTabProps } from "./types";
import KpiCard from "./KpiCard";
import PurchaseCalendar from "./PurchaseCalendar";

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

const AnalyticsTab = ({
  purchases,
  currentGoldPrice,
  totalInvested,
  averagePricePerGram,
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
  // Chart data
  const chronologicalPurchases = [...purchases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = chronologicalPurchases.reduce((acc, purchase, index) => {
    const cumulativeInvested = chronologicalPurchases
      .slice(0, index + 1)
      .reduce((sum, p) => sum + p.amountPaid, 0);
    const cumulativeGrams = chronologicalPurchases
      .slice(0, index + 1)
      .reduce((sum, p) => sum + p.grams, 0);
    const cumulativeValue = cumulativeGrams * currentGoldPrice;

    acc.push({
      date: purchase.date,
      invested: cumulativeInvested,
      value: cumulativeValue
    });
    return acc;
  }, [] as Array<{ date: string; invested: number; value: number }>);

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

      {/* Detailed KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Clock}
          title="Investment Tenure"
          value={`${investmentDays} days`}
          valueClass="text-gold"
          subtitle={firstPurchaseDate ? `Since ${new Date(firstPurchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No purchases yet'}
        />
        <KpiCard
          icon={Hash}
          title="Total Purchases"
          value={purchases.length}
          valueClass="text-foreground"
          subtitle={`Avg ${formatWeight(avgPurchaseSize)} per purchase`}
        />
        <KpiCard
          icon={Wallet}
          title="Avg Investment"
          value={formatCurrency(avgInvestmentPerPurchase)}
          valueClass="text-foreground"
          subtitle="Per purchase"
        />
        <KpiCard
          icon={TrendingUp}
          iconColor={unrealizedGainPerGram >= 0 ? "text-success" : "text-destructive"}
          bgColor={unrealizedGainPerGram >= 0 ? "bg-success/10" : "bg-destructive/10"}
          title="Unrealized Gain/g"
          value={formatCurrency(unrealizedGainPerGram)}
          valueClass={unrealizedGainPerGram >= 0 ? 'text-success' : 'text-destructive'}
          subtitle={`Current: ${formatCurrency(currentGoldPrice)}/g vs Avg: ${formatCurrency(averagePricePerGram)}/g`}
        />
        <KpiCard
          icon={ArrowUpRight}
          iconColor="text-destructive"
          bgColor="bg-destructive/10"
          title="Highest Price Paid"
          value={formatCurrency(highestPricePaid)}
          valueClass="text-foreground"
          subtitle="Per gram"
        />
        <KpiCard
          icon={ArrowDownRight}
          iconColor="text-success"
          bgColor="bg-success/10"
          title="Lowest Price Paid"
          value={formatCurrency(lowestPricePaid)}
          valueClass="text-foreground"
          subtitle="Per gram"
        />
        <KpiCard
          icon={Scale}
          title="Price Spread"
          value={formatCurrency(priceSpread)}
          valueClass="text-foreground"
          subtitle={`${formatPercentage(priceSpreadPercentage)} range`}
        />
        <KpiCard
          icon={Coins}
          title="Largest Purchase"
          value={formatWeight(largestPurchase)}
          valueClass="text-gold"
          subtitle={`Smallest: ${formatWeight(smallestPurchase)}`}
        />
      </div>

      {/* Investment vs Value Chart */}
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
      )}
    </div>
  );
};

export default AnalyticsTab;
