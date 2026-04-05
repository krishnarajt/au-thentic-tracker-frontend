export const MAX_DECIMALS = 3;

const getFactor = (decimals: number) => 10 ** decimals;

export const roundToDecimals = (value: number, decimals = MAX_DECIMALS): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = getFactor(decimals);
  return Math.round(value * factor) / factor;
};

export const formatNumber = (
  value: number,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    useGrouping?: boolean;
  }
): string => {
  const maximumFractionDigits = options?.maximumFractionDigits ?? MAX_DECIMALS;
  const minimumFractionDigits = options?.minimumFractionDigits ?? 0;
  const useGrouping = options?.useGrouping ?? false;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(roundToDecimals(value, maximumFractionDigits));
};
