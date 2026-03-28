import { GoldPurchase } from "@/types/gold";
import React from "react";

export type SortField = 'date' | 'grams' | 'amountPaid' | 'pricePerGram' | 'currentValue' | 'return';
export type SortDirection = 'asc' | 'desc';

export interface DashboardTabProps {
  purchases: GoldPurchase[];
  totalGrams: number;
  totalInvested: number;
  averagePricePerGram: number;
  currentValue: number;
  currentGoldPrice: number;
  totalReturn: number;
  returnPercentage: number;
  totalXIRR: number;
}

export interface PurchasesTabProps {
  purchases: GoldPurchase[];
  currentGoldPrice: number;
  lastMonthGoldPrice: number;
  isLoadingPrice: boolean;
  isLoadingHistoricalPrice: boolean;
  isLoadingData: boolean;
  averagePricePerGram: number;
  newPurchase: { grams: string; date: string };
  setNewPurchase: (value: { grams: string; date: string }) => void;
  setCurrentGoldPrice: (value: number) => void;
  setLastMonthGoldPrice: (value: number) => void;
  fetchCurrentGoldPrice: () => void;
  fetchLastMonthGoldPrice: () => void;
  addPurchase: () => void;
  removePurchase: (id: string) => void;
  updatePurchase: (id: string, updated: Partial<GoldPurchase>) => void;
  importPurchases: (purchases: Omit<GoldPurchase, 'id'>[]) => void;
}

export interface AnalyticsTabProps {
  purchases: GoldPurchase[];
  currentGoldPrice: number;
  totalGrams: number;
  totalInvested: number;
  averagePricePerGram: number;
  currentValue: number;
  totalReturn: number;
  monthlyReturn: number;
  monthlyReturnPercentage: number;
  monthlyXIRR: number;
  returnSinceLastInvestment: number;
  returnSinceLastInvestmentPercentage: number;
  sinceLastInvestmentXIRR: number;
  lastInvestmentDate: string | null;
  totalXIRR: number;
  firstPurchaseDate: string | null;
  investmentDays: number;
  highestPricePaid: number;
  lowestPricePaid: number;
  largestPurchase: number;
  smallestPurchase: number;
  avgPurchaseSize: number;
  avgInvestmentPerPurchase: number;
  priceSpread: number;
  priceSpreadPercentage: number;
  unrealizedGainPerGram: number;
}

export interface KpiCardProps {
  icon: React.ElementType;
  iconColor?: string;
  bgColor?: string;
  title: string;
  value: React.ReactNode;
  valueClass?: string;
  subtitle?: React.ReactNode;
  delay?: string;
}
