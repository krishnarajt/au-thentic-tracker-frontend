import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Coins, Wallet, TrendingUp, TrendingDown, IndianRupeeIcon } from "lucide-react";
import { formatCurrency, formatWeight, formatPercentage } from "@/utils/formatters";
import { toBasePrice } from "@/utils/goldPricing";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { DashboardTabProps } from "./types";

const barChartConfig = {
  invested: {
    label: "Amount Invested",
    color: "hsl(45, 70%, 50%)",
  },
};

const DashboardTab = ({
  purchases,
  totalGrams,
  totalInvested,
  averagePricePerGram,
  currentValue,
  currentGoldPrice,
  totalReturn,
  returnPercentage,
  totalXIRR,
}: DashboardTabProps) => {
  const currentBasePrice = toBasePrice(currentGoldPrice);

  const monthlyInvestmentData = useMemo(() => {
    const map = new Map<string, { month: string; invested: number; grams: number }>();
    purchases.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = map.get(key);
      if (existing) {
        existing.invested += p.amountPaid;
        existing.grams += p.grams;
      } else {
        map.set(key, { month: label, invested: p.amountPaid, grams: p.grams });
      }
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [purchases]);

  return (
    <div className="space-y-6">
      {/* Top 4 KPIs */}
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
              @ {formatCurrency(currentGoldPrice)}/g incl. tax
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Base: {formatCurrency(currentBasePrice)}/g
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

      {/* Monthly Investment Bar Chart (horizontal) */}
      {monthlyInvestmentData.length > 0 && (
        <Card className="glass-card gold-border-glow overflow-hidden relative">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-playfair text-gold/90">Monthly Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyInvestmentData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCurrency(value)}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Amount Invested"
                    ]}
                  />
                  <Bar
                    dataKey="invested"
                    radius={[0, 4, 4, 0]}
                    fill="hsl(45, 70%, 50%)"
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardTab;
