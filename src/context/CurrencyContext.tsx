"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CurrencyContextValue {
  currency: string;
  rate: number;
  setCurrency: (c: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (currency === "USD") { setRate(1); return; }
    fetch(`https://open.er-api.com/v6/latest/USD`)
      .then(r => r.json())
      .then(d => setRate(d.rates?.[currency] ?? 1))
      .catch(() => setRate(1));
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, rate, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be in CurrencyProvider");
  return ctx;
}