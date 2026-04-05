import { formatNumber } from "@/utils/numbers";

const RUPEE_SYMBOL = "\u20b9";

export const formatCurrency = (amount: number): string => {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (abs >= 10000000) {
    return `${sign}${RUPEE_SYMBOL}${formatNumber(abs / 10000000)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${RUPEE_SYMBOL}${formatNumber(abs / 100000)}L`;
  }
  if (abs >= 1000) {
    return `${sign}${RUPEE_SYMBOL}${formatNumber(abs / 1000)}K`;
  }

  return `${sign}${RUPEE_SYMBOL}${formatNumber(abs)}`;
};

export const formatWeight = (grams: number): string => `${formatNumber(grams)}g`;

export const formatPercentage = (percentage: number): string => `${formatNumber(percentage)}%`;
