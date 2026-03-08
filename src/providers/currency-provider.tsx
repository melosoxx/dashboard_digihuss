"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export type CurrencyCode = "ARS" | "USD" | "EUR" | "BRL";

interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  locale: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  ARS: { code: "ARS", label: "Peso Argentino", locale: "es-AR", symbol: "$", decimals: 2 },
  USD: { code: "USD", label: "Dólar Estadounidense", locale: "en-US", symbol: "US$", decimals: 2 },
  EUR: { code: "EUR", label: "Euro", locale: "de-DE", symbol: "€", decimals: 2 },
  BRL: { code: "BRL", label: "Real Brasileño", locale: "pt-BR", symbol: "R$", decimals: 2 },
};

interface RatesCache {
  rates: Record<string, number>;
  timestamp: number;
}

const RATES_CACHE_KEY = "wwh_currency_rates";
const CURRENCY_PREF_KEY = "wwh_selected_currency";
const RATES_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: Record<string, number>;
  ratesTimestamp: Date | null;
  ratesError: boolean;
  isLoadingRates: boolean;
  refreshRates: () => void;
  /** Convert an ARS amount to the selected currency */
  convert: (amountARS: number) => number;
  /** Convert + format an ARS amount in the selected currency */
  formatMoney: (amountARS: number) => string;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function loadCachedRates(): RatesCache | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesCache;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedRates(rates: Record<string, number>) {
  try {
    const cache: RatesCache = { rates, timestamp: Date.now() };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

function loadSavedCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem(CURRENCY_PREF_KEY);
    if (saved && saved in CURRENCIES) return saved as CurrencyCode;
  } catch {
    // ignore
  }
  return "ARS";
}

async function fetchRates(): Promise<Record<string, number>> {
  // open.er-api.com is free, no API key required, returns rates with ARS as base
  const res = await fetch("https://open.er-api.com/v6/latest/ARS");
  if (!res.ok) throw new Error("Exchange rate fetch failed");
  const data = await res.json();
  if (data.result !== "success") throw new Error("Exchange rate API error");
  return data.rates as Record<string, number>;
}

function formatWithCurrency(amount: number, config: CurrencyConfig): string {
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("ARS");
  const [rates, setRates] = useState<Record<string, number>>({ ARS: 1, USD: 1, EUR: 1, BRL: 1 });
  const [ratesTimestamp, setRatesTimestamp] = useState<Date | null>(null);
  const [ratesError, setRatesError] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const fetchingRef = useRef(false);

  const doFetchRates = useCallback(async (force = false) => {
    if (fetchingRef.current) return;

    // Check cache first
    if (!force) {
      const cached = loadCachedRates();
      if (cached && Date.now() - cached.timestamp < RATES_TTL_MS) {
        setRates(cached.rates);
        setRatesTimestamp(new Date(cached.timestamp));
        setRatesError(false);
        return;
      }
    }

    fetchingRef.current = true;
    setIsLoadingRates(true);
    try {
      const freshRates = await fetchRates();
      setRates(freshRates);
      setRatesTimestamp(new Date());
      setRatesError(false);
      saveCachedRates(freshRates);
    } catch {
      setRatesError(true);
      // Fall back to last cached rates if available
      const cached = loadCachedRates();
      if (cached) {
        setRates(cached.rates);
        setRatesTimestamp(new Date(cached.timestamp));
      }
    } finally {
      setIsLoadingRates(false);
      fetchingRef.current = false;
    }
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setCurrencyState(loadSavedCurrency());
    doFetchRates();
  }, [doFetchRates]);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(CURRENCY_PREF_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  const refreshRates = useCallback(() => {
    doFetchRates(true);
  }, [doFetchRates]);

  const convert = useCallback(
    (amountARS: number): number => {
      if (currency === "ARS") return amountARS;
      const rate = rates[currency] ?? 1;
      return amountARS * rate;
    },
    [currency, rates]
  );

  const formatMoney = useCallback(
    (amountARS: number): string => {
      const converted = convert(amountARS);
      const config = CURRENCIES[currency];
      return formatWithCurrency(converted, config);
    },
    [convert, currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        ratesTimestamp,
        ratesError,
        isLoadingRates,
        refreshRates,
        convert,
        formatMoney,
        currencySymbol: CURRENCIES[currency].symbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
