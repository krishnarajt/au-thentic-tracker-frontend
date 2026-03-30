export const formatCurrency = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  } else if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  } else if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${abs.toFixed(2)}`;
};

export const formatWeight = (grams: number): string => {
  return `${grams.toFixed(2)}g`;
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};