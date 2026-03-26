import { useMemo } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { GoldPurchase } from "@/types/gold";
import { formatCurrency, formatWeight } from "@/utils/formatters";

const PurchaseCalendar = ({ purchases }: { purchases: GoldPurchase[] }) => {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const purchaseMap = useMemo(() => {
    const map = new Map<string, { count: number; grams: number; amount: number }>();
    purchases.forEach(p => {
      const dateKey = p.date.split('T')[0];
      const existing = map.get(dateKey);
      if (existing) {
        existing.count++;
        existing.grams += p.grams;
        existing.amount += p.amountPaid;
      } else {
        map.set(dateKey, { count: 1, grams: p.grams, amount: p.amountPaid });
      }
    });
    return map;
  }, [purchases]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    const start = new Date(oneYearAgo);
    start.setDate(start.getDate() - start.getDay());
    let current = new Date(start);

    let week: Date[] = [];
    while (current <= today || week.length > 0) {
      week.push(new Date(current));
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      current.setDate(current.getDate() + 1);
      if (current > today && week.length === 0) break;
    }
    if (week.length > 0) {
      result.push(week);
    }
    return result;
  }, []);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: firstDay.toLocaleDateString('en-US', { month: 'short' }),
          col: i
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const getCellColor = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const data = purchaseMap.get(dateKey);
    if (!data) return 'bg-gold/[0.04] border-gold/[0.06]';
    if (data.grams >= 5) return 'bg-gold border-gold/60 shadow-[0_0_6px_rgba(212,175,55,0.4)]';
    if (data.grams >= 2) return 'bg-gold/70 border-gold/50';
    return 'bg-gold/40 border-gold/30';
  };

  const isInRange = (date: Date) => date >= oneYearAgo && date <= today;

  return (
    <div className="overflow-x-auto">
      <div className="flex ml-8 mb-1 gap-0">
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="text-[10px] text-muted-foreground/60 font-inter"
            style={{ position: 'relative', left: `${m.col * 14}px` }}
          >
            {i > 0 ? m.label : ''}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[12px] w-6 text-[10px] text-muted-foreground/50 font-inter flex items-center justify-end pr-1">
              {label}
            </div>
          ))}
        </div>

        <TooltipProvider delayDuration={100}>
          <div className="flex gap-[2px]">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[2px]">
                {week.map((day, dayIdx) => {
                  const dateKey = day.toISOString().split('T')[0];
                  const data = purchaseMap.get(dateKey);
                  const inRange = isInRange(day);

                  return (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-[12px] w-[12px] rounded-[2px] border transition-colors ${
                            inRange ? getCellColor(day) : 'bg-transparent border-transparent'
                          }`}
                        />
                      </TooltipTrigger>
                      {inRange && (
                        <TooltipContent className="bg-background/95 backdrop-blur border-gold/20">
                          <div className="text-xs">
                            <div className="font-medium">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            {data ? (
                              <div className="text-gold mt-0.5">
                                {data.count} purchase{data.count > 1 ? 's' : ''} — {formatWeight(data.grams)} ({formatCurrency(data.amount)})
                              </div>
                            ) : (
                              <div className="text-muted-foreground">No purchases</div>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2 mt-3 ml-8">
        <span className="text-[10px] text-muted-foreground/50 font-inter">Less</span>
        <div className="h-[12px] w-[12px] rounded-[2px] bg-gold/[0.04] border border-gold/[0.06]" />
        <div className="h-[12px] w-[12px] rounded-[2px] bg-gold/40 border border-gold/30" />
        <div className="h-[12px] w-[12px] rounded-[2px] bg-gold/70 border border-gold/50" />
        <div className="h-[12px] w-[12px] rounded-[2px] bg-gold border border-gold/60" />
        <span className="text-[10px] text-muted-foreground/50 font-inter">More</span>
      </div>
    </div>
  );
};

export default PurchaseCalendar;
