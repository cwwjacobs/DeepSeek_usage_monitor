/**
 * DeepSeek Usage Monitor — Standalone TUI
 *
 * Renders a live balance monitor with multi-currency support.
 * No session required. Shows:
 *   - Live DeepSeek account balance
 *   - Pricing reference table
 *   - Currency selector (← → arrows, persists to config)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  type CurrencyCode,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
  PRICING,
  DEFAULT_PRICING,
  DEFAULT_CURRENCY,
  convertFromCny,
  formatCost,
  formatBalance,
} from "./currency";

// ── Config persistence ──────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const CONFIG_PATH = join(homedir(), ".deepseek-usage-monitor.json");

function loadCurrency(): CurrencyCode {
  try {
    if (existsSync(CONFIG_PATH)) {
      const data = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
      if (data.currency && SUPPORTED_CURRENCIES.includes(data.currency)) {
        return data.currency as CurrencyCode;
      }
    }
  } catch {}
  return DEFAULT_CURRENCY;
}

function saveCurrency(currency: CurrencyCode): void {
  try {
    mkdirSync(dirname(CONFIG_PATH), { recursive: true });
    writeFileSync(CONFIG_PATH, JSON.stringify({ currency }, null, 2), "utf8");
  } catch {}
}

// ── Balance API ─────────────────────────────────────────────────────────────

const BALANCE_URL = "https://api.deepseek.com/user/balance";

type BalanceState = {
  text: string;
  color: string | undefined;
};

function resolveApiKey(): string | null {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  if (process.env.DEEPCODE_API_KEY) return process.env.DEEPCODE_API_KEY;
  return null;
}

async function fetchBalance(currency: CurrencyCode): Promise<BalanceState> {
  const apiKey = resolveApiKey();
  if (!apiKey) return { text: "Set DEEPSEEK_API_KEY env var", color: "red" };

  const resp = await fetch(BALANCE_URL, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!resp.ok) {
    if (resp.status === 401) return { text: "Unauthorized — check API key", color: "red" };
    return { text: `HTTP ${resp.status}`, color: "red" };
  }

  const data = (await resp.json()) as {
    is_available?: boolean;
    balance_infos?: Array<{ currency?: string; total_balance?: string }>;
  };

  if (!data?.is_available) return { text: "N/A", color: undefined };

  const infos = data.balance_infos ?? [];
  let totalCny = 0;
  for (const info of infos) {
    const bal = Number.parseFloat(info.total_balance ?? "0");
    if (!Number.isNaN(bal)) totalCny += bal;
  }

  if (totalCny === 0) return { text: "¥0.00", color: "green" };

  const converted = convertFromCny(totalCny, currency);
  return { text: formatBalance(converted, currency), color: "green" };
}

// ── Component ───────────────────────────────────────────────────────────────

const REFRESH_MS = 2000;
const BALANCE_TTL_MS = 120_000;

export function Monitor(): React.ReactElement {
  const [currency, setCurrency] = useState<CurrencyCode>(loadCurrency);
  const [balance, setBalance] = useState<BalanceState>({ text: "loading…", color: undefined });
  const [tick, setTick] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Periodic refresh
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  // Fetch balance
  const lastFetch = useRef(0);
  useEffect(() => {
    if (Date.now() - lastFetch.current < BALANCE_TTL_MS) return;
    lastFetch.current = Date.now();
    fetchBalance(currency).then(setBalance);
  }, [tick, currency]);

  // Exit handling
  useEffect(() => {
    if (exiting) {
      const t = setTimeout(() => process.exit(0), 50);
      return () => clearTimeout(t);
    }
  }, [exiting]);

  useEffect(() => {
    const onSigInt = () => process.exit(0);
    process.on("SIGINT", onSigInt);
    return () => {
      process.removeListener("SIGINT", onSigInt);
    };
  }, []);

  const cycleCurrency = useCallback((direction: 1 | -1) => {
    setCurrency((prev) => {
      const idx = SUPPORTED_CURRENCIES.indexOf(prev);
      const next = SUPPORTED_CURRENCIES[(idx + direction + SUPPORTED_CURRENCIES.length) % SUPPORTED_CURRENCIES.length];
      saveCurrency(next);
      return next;
    });
  }, []);

  useInput((input, key) => {
    if (key.escape || (key.ctrl && (input === "c" || input === "C"))) {
      setExiting(true);
      return;
    }
    if (key.leftArrow) {
      cycleCurrency(-1);
      return;
    }
    if (key.rightArrow) {
      cycleCurrency(1);
      return;
    }
  });

  // Pricing table
  const pricingRows = useMemo(() => {
    const models = Object.keys(PRICING);
    return models.map((model) => {
      const p = PRICING[model] ?? DEFAULT_PRICING;
      return {
        model: model.replace("deepseek-", ""),
        cacheHit: formatCost(convertFromCny(p.cacheHit, currency), currency),
        cacheMiss: formatCost(convertFromCny(p.cacheMiss, currency), currency),
        output: formatCost(convertFromCny(p.output, currency), currency),
      };
    });
  }, [currency]);

  return (
    <Box flexDirection="column" width={52} borderStyle="round" borderDimColor paddingX={1} marginTop={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Text bold color="#229ac3">
          DeepSeek Usage Monitor
        </Text>
        <Text dimColor>Esc to quit</Text>
      </Box>

      {/* Balance */}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Account Balance</Text>
        <Box gap={1}>
          <Text bold color={balance.color}>
            {balance.text}
          </Text>
          <Text dimColor>
            (converted from CNY)
          </Text>
        </Box>
      </Box>

      {/* Currency selector */}
      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>Display Currency</Text>
        <Box gap={1}>
          <Text dimColor>←</Text>
          <Text color="yellow">
            {currency} ({CURRENCY_SYMBOLS[currency]})
          </Text>
          <Text dimColor>→</Text>
        </Box>
      </Box>

      {/* Pricing reference */}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>DeepSeek V4 Pricing (per 1M tokens)</Text>
        {pricingRows.map((row) => (
          <Box key={row.model} gap={2}>
            <Text dimColor>{row.model}:</Text>
            <Text dimColor>cache {row.cacheHit}</Text>
            <Text dimColor>input {row.cacheMiss}</Text>
            <Text dimColor>output {row.output}</Text>
          </Box>
        ))}
      </Box>

      {/* API key hint */}
      <Box marginTop={1}>
        <Text dimColor>
          {resolveApiKey() ? `API key: ${resolveApiKey()!.slice(0, 8)}…` : "Set DEEPSEEK_API_KEY to show balance"}
        </Text>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>← → change currency  ·  auto-refreshes</Text>
      </Box>
    </Box>
  );
}
