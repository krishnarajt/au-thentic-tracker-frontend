export const GOLD_TAX_RATE = 0.05;
export const GOLD_TAX_MULTIPLIER = 1 + GOLD_TAX_RATE;

export const toTaxInclusivePrice = (basePrice: number): number => {
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return 0;
  }

  return basePrice * GOLD_TAX_MULTIPLIER;
};

export const toBasePrice = (taxInclusivePrice: number): number => {
  if (!Number.isFinite(taxInclusivePrice) || taxInclusivePrice <= 0) {
    return 0;
  }

  return taxInclusivePrice / GOLD_TAX_MULTIPLIER;
};
