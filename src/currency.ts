/**
 * Currency support for DeepSeek Usage Monitor.
 *
 * All DeepSeek pricing is in CNY. This module provides exchange rates
 * and formatting to display costs in the user's preferred currency.
 *
 * DeepSeek V4 pricing (June 2026 permanent price cut):
 *   https://platform.deepseek.com/api-docs/pricing
 */

// ── Supported currencies ────────────────────────────────────────────────────

export type CurrencyCode = "USD" | "CNY" | "EUR" | "GBP" | "JPY";

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ["USD", "CNY", "EUR", "GBP", "JPY"];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: "US Dollar",
  CNY: "Chinese Yuan",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
};

// ── DeepSeek V4 Pricing (CNY per million tokens) ────────────────────────────

export const PRICING: Record<string, { cacheHit: number; cacheMiss: number; output: number }> = {
  "deepseek-v4-pro": { cacheHit: 0.025, cacheMiss: 3, output: 6 },
  "deepseek-v4-flash": { cacheHit: 0.02, cacheMiss: 1, output: 2 },
};

export const DEFAULT_PRICING = { cacheHit: 0.025, cacheMiss: 3, output: 6 };

// ── Exchange rates (CNY → target) ───────────────────────────────────────────

/**
 * Approximate exchange rates, June 2026.
 * Key: 1 CNY → value in target currency.
 */
const CNY_TO: Record<CurrencyCode, number> = {
  CNY: 1.0,
  USD: 0.14,
  EUR: 0.13,
  GBP: 0.11,
  JPY: 22.0,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function convertFromCny(amountCny: number, currency: CurrencyCode): number {
  return amountCny * (CNY_TO[currency] ?? 1);
}

export function formatCost(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$";
  if (currency === "JPY") {
    if (amount >= 1) return `${symbol}${amount.toFixed(0)}`;
    if (amount >= 0.01) return `${symbol}${amount.toFixed(2)}`;
    return `${symbol}${amount.toExponential(2)}`;
  }
  if (amount >= 1) return `${symbol}${amount.toFixed(2)}`;
  if (amount >= 0.01) return `${symbol}${amount.toFixed(4)}`;
  return `${symbol}${amount.toExponential(2)}`;
}

export function formatBalance(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$";
  if (currency === "JPY") return `${symbol}${amount.toFixed(0)}`;
  return `${symbol}${amount.toFixed(2)}`;
}
