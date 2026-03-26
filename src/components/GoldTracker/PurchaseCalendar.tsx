import { useMemo, useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { GoldPurchase } from "@/types/gold";
import { formatCurrency, formatWeight } from "@/utils/formatters";

type CalendarMode = "1y" | "10y" | "20y" | "50y";

const PurchaseCalendar = ({ purchases }: { purchases: GoldPurchase[] }) => {
  const [mode, setMode] = useState<CalendarMode>("1y");
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Day-level purchase map (for 1y view)
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

  // Week-level purchase map (for 10y view) keyed by "YYYY-WW"
  const weekPurchaseMap = useMemo(() => {
    const map = new Map<string, { count: number; grams: number; amount: number }>();
    purchases.forEach(p => {
      const d = new Date(p.date);
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.floor(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay()) / 7);
      const key = `${d.getFullYear()}-${weekNum}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.grams += p.grams;
        existing.amount += p.amountPaid;
      } else {
        map.set(key, { count: 1, grams: p.grams, amount: p.amountPaid });
      }
    });
    return map;
  }, [purchases]);

  // Month-level purchase map (for 20y/50y views) keyed by "YYYY-MM"
  const monthPurchaseMap = useMemo(() => {
    const map = new Map<string, { count: number; grams: number; amount: number }>();
    purchases.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.grams += p.grams;
        existing.amount += p.amountPaid;
      } else {
        map.set(key, { count: 1, grams: p.grams, amount: p.amountPaid });
      }
    });
    return map;
  }, [purchases]);

  // Quarter-level purchase map (for 50y view) keyed by "YYYY-Q#"
  const quarterPurchaseMap = useMemo(() => {
    const map = new Map<string, { count: number; grams: number; amount: number }>();
    purchases.forEach(p => {
      const d = new Date(p.date);
      const q = Math.floor(d.getMonth() / 3) + 1;
      const key = `${d.getFullYear()}-Q${q}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.grams += p.grams;
        existing.amount += p.amountPaid;
      } else {
        map.set(key, { count: 1, grams: p.grams, amount: p.amountPaid });
      }
    });
    return map;
  }, [purchases]);

  // 1y view: weeks (columns) of days (rows)
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

  // 10y view: rows = years, columns = week numbers (0-52)
  const decadeData = useMemo(() => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 9; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // 20y view: rows = years, columns = months (0-11)
  const twentyYearData = useMemo(() => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 19; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // 50y view: rows = decades, columns = years within decade with quarters
  const fiftyYearData = useMemo(() => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 49; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
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

  // Month labels for 10y view (approximate week positions)
  const decadeMonthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      const approxWeek = Math.floor((m * 365.25) / (12 * 7));
      labels.push({ label: monthNames[m], col: approxWeek });
    }
    return labels;
  }, []);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

  const getCellColor = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const data = purchaseMap.get(dateKey);
    if (!data) return 'bg-gold/[0.04] border-gold/[0.06]';
    if (data.grams >= 5) return 'bg-gold border-gold/60 shadow-[0_0_6px_rgba(212,175,55,0.4)]';
    if (data.grams >= 2) return 'bg-gold/70 border-gold/50';
    return 'bg-gold/40 border-gold/30';
  };

  const getWeekCellColor = (data: { count: number; grams: number; amount: number } | undefined) => {
    if (!data) return 'bg-gold/[0.04] border-gold/[0.06]';
    if (data.grams >= 10) return 'bg-gold border-gold/60 shadow-[0_0_6px_rgba(212,175,55,0.4)]';
    if (data.grams >= 5) return 'bg-gold/70 border-gold/50';
    return 'bg-gold/40 border-gold/30';
  };

  const getMonthCellColor = (data: { count: number; grams: number; amount: number } | undefined) => {
    if (!data) return 'bg-gold/[0.04] border-gold/[0.06]';
    if (data.grams >= 20) return 'bg-gold border-gold/60 shadow-[0_0_6px_rgba(212,175,55,0.4)]';
    if (data.grams >= 10) return 'bg-gold/70 border-gold/50';
    if (data.grams >= 5) return 'bg-gold/60 border-gold/40';
    return 'bg-gold/40 border-gold/30';
  };

  const getQuarterCellColor = (data: { count: number; grams: number; amount: number } | undefined) => {
    if (!data) return 'bg-gold/[0.04] border-gold/[0.06]';
    if (data.grams >= 30) return 'bg-gold border-gold/60 shadow-[0_0_6px_rgba(212,175,55,0.4)]';
    if (data.grams >= 15) return 'bg-gold/70 border-gold/50';
    if (data.grams >= 5) return 'bg-gold/60 border-gold/40';
    return 'bg-gold/40 border-gold/30';
  };

  const isInRange = (date: Date) => date >= oneYearAgo && date <= today;

  const getWeekStartDate = (year: number, weekNum: number) => {
    const jan1 = new Date(year, 0, 1);
    const dayOffset = jan1.getDay();
    const date = new Date(year, 0, 1 + weekNum * 7 - dayOffset);
    return date;
  };

  const isWeekInRange = (year: number, weekNum: number) => {
    const tenYearsAgo = new Date(today);
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const weekStart = getWeekStartDate(year, weekNum);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return weekStart <= today && weekEnd >= tenYearsAgo;
  };

  const isMonthInRange = (year: number, month: number, yearsBack: number) => {
    const rangeStart = new Date(today);
    rangeStart.setFullYear(rangeStart.getFullYear() - yearsBack);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return monthStart <= today && monthEnd >= rangeStart;
  };

  const isQuarterInRange = (year: number, quarter: number) => {
    const rangeStart = new Date(today);
    rangeStart.setFullYear(rangeStart.getFullYear() - 50);
    const qStart = new Date(year, (quarter - 1) * 3, 1);
    const qEnd = new Date(year, quarter * 3, 0);
    return qStart <= today && qEnd >= rangeStart;
  };

  const modes: { value: CalendarMode; label: string }[] = [
    { value: "1y", label: "1 Year" },
    { value: "10y", label: "10 Years" },
    { value: "20y", label: "20 Years" },
    { value: "50y", label: "50 Years" },
  ];

  return (
    <div className="overflow-x-auto">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`text-[11px] font-inter px-2.5 py-1 rounded-md transition-colors ${
              mode === m.value
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-gold/5 border border-transparent"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "1y" ? (
        <>
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
        </>
      ) : mode === "10y" ? (
        <>
          {/* 10-year view: rows = years, columns = week numbers */}
          <div className="flex ml-10 mb-1 gap-0">
            {decadeMonthLabels.map((m, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground/60 font-inter"
                style={{ position: 'relative', left: `${m.col * 12}px`, width: i < 11 ? `${((decadeMonthLabels[i + 1]?.col ?? 53) - m.col) * 12}px` : 'auto' }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            <div className="flex flex-col gap-[2px] mr-1">
              {decadeData.map((year) => (
                <div key={year} className="h-[10px] w-8 text-[10px] text-muted-foreground/50 font-inter flex items-center justify-end pr-1">
                  {year}
                </div>
              ))}
            </div>

            <TooltipProvider delayDuration={100}>
              <div className="flex flex-col gap-[2px]">
                {decadeData.map((year) => (
                  <div key={year} className="flex gap-[2px]">
                    {Array.from({ length: 53 }, (_, weekNum) => {
                      const key = `${year}-${weekNum}`;
                      const data = weekPurchaseMap.get(key);
                      const inRange = isWeekInRange(year, weekNum);
                      const weekStart = getWeekStartDate(year, weekNum);
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekEnd.getDate() + 6);

                      return (
                        <Tooltip key={weekNum}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[10px] w-[10px] rounded-[2px] border transition-colors ${
                                inRange ? getWeekCellColor(data) : 'bg-transparent border-transparent'
                              }`}
                            />
                          </TooltipTrigger>
                          {inRange && (
                            <TooltipContent className="bg-background/95 backdrop-blur border-gold/20">
                              <div className="text-xs">
                                <div className="font-medium">
                                  {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
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
        </>
      ) : mode === "20y" ? (
        <>
          {/* 20-year view: rows = months, columns = years (horizontal) */}
          <div className="flex ml-10 mb-1 gap-0">
            {twentyYearData.map((year) => (
              <div
                key={year}
                className="text-[10px] text-muted-foreground/60 font-inter text-center"
                style={{ width: '24px', marginRight: '3px' }}
              >
                {year % 2 === 0 ? String(year).slice(-2) : ''}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            <div className="flex flex-col gap-[3px] mr-1">
              {monthNames.map((name) => (
                <div key={name} className="h-[22px] w-8 text-[10px] text-muted-foreground/50 font-inter flex items-center justify-end pr-1">
                  {name}
                </div>
              ))}
            </div>

            <TooltipProvider delayDuration={100}>
              <div className="flex flex-col gap-[3px]">
                {Array.from({ length: 12 }, (_, month) => (
                  <div key={month} className="flex gap-[3px]">
                    {twentyYearData.map((year) => {
                      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
                      const data = monthPurchaseMap.get(key);
                      const inRange = isMonthInRange(year, month, 20);

                      return (
                        <Tooltip key={year}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[22px] w-[24px] rounded-[3px] border transition-colors ${
                                inRange ? getMonthCellColor(data) : 'bg-transparent border-transparent'
                              }`}
                            />
                          </TooltipTrigger>
                          {inRange && (
                            <TooltipContent className="bg-background/95 backdrop-blur border-gold/20">
                              <div className="text-xs">
                                <div className="font-medium">
                                  {monthNames[month]} {year}
                                </div>
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
        </>
      ) : (
        <>
          {/* 50-year view: rows = quarters, columns = years (horizontal) */}
          <div className="flex ml-8 mb-1 gap-0">
            {fiftyYearData.map((year) => (
              <div
                key={year}
                className="text-[10px] text-muted-foreground/60 font-inter text-center"
                style={{ width: '12px', marginRight: '2px' }}
              >
                {year % 5 === 0 ? String(year).slice(-2) : ''}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            <div className="flex flex-col gap-[2px] mr-1">
              {quarterNames.map((name) => (
                <div key={name} className="h-[12px] w-6 text-[10px] text-muted-foreground/50 font-inter flex items-center justify-end pr-1">
                  {name}
                </div>
              ))}
            </div>

            <TooltipProvider delayDuration={100}>
              <div className="flex flex-col gap-[2px]">
                {Array.from({ length: 4 }, (_, qi) => (
                  <div key={qi} className="flex gap-[2px]">
                    {fiftyYearData.map((year) => {
                      const quarter = qi + 1;
                      const key = `${year}-Q${quarter}`;
                      const data = quarterPurchaseMap.get(key);
                      const inRange = isQuarterInRange(year, quarter);
                      const qStartMonth = (quarter - 1) * 3;
                      const qEndMonth = quarter * 3 - 1;

                      return (
                        <Tooltip key={year}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[12px] w-[12px] rounded-[2px] border transition-colors ${
                                inRange ? getQuarterCellColor(data) : 'bg-transparent border-transparent'
                              }`}
                            />
                          </TooltipTrigger>
                          {inRange && (
                            <TooltipContent className="bg-background/95 backdrop-blur border-gold/20">
                              <div className="text-xs">
                                <div className="font-medium">
                                  {monthNames[qStartMonth]} – {monthNames[qEndMonth]} {year}
                                </div>
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
        </>
      )}

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
