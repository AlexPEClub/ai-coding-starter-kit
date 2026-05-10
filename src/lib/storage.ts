"use client";

import { useEffect, useSyncExternalStore } from "react";
import { defaultConfig, SCHEMA_VERSION } from "./defaults";
import type { AppConfig, Quote } from "./types";

const CONFIG_KEY = "mf-pricing.config.v1";
const QUOTES_KEY = "mf-pricing.quotes.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

function readConfigFromStorage(): AppConfig {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw) as AppConfig;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return defaultConfig;
    return parsed;
  } catch {
    return defaultConfig;
  }
}

function readQuotesFromStorage(): Quote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUOTES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Quote[];
  } catch {
    return [];
  }
}

export function getConfig(): AppConfig {
  return readConfigFromStorage();
}

export function saveConfig(next: AppConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  notify();
}

export function resetConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONFIG_KEY);
  notify();
}

export function getQuotes(): Quote[] {
  return readQuotesFromStorage();
}

export function saveQuote(q: Quote) {
  if (typeof window === "undefined") return;
  const all = readQuotesFromStorage();
  const idx = all.findIndex((x) => x.id === q.id);
  if (idx >= 0) all[idx] = q;
  else all.unshift(q);
  window.localStorage.setItem(QUOTES_KEY, JSON.stringify(all));
  notify();
}

export function deleteQuote(id: string) {
  if (typeof window === "undefined") return;
  const all = readQuotesFromStorage().filter((q) => q.id !== id);
  window.localStorage.setItem(QUOTES_KEY, JSON.stringify(all));
  notify();
}

export function getNextQuoteNumber(): string {
  const year = new Date().getFullYear();
  const all = readQuotesFromStorage();
  const prefix = `Q-${year}-`;
  const yearQuotes = all.filter((q) => q.number.startsWith(prefix));
  const next = yearQuotes.length + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONFIG_KEY || e.key === QUOTES_KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(listener);
}

export function useConfig(): AppConfig {
  const config = useSyncExternalStore(
    subscribe,
    () => readConfigFromStorage(),
    () => defaultConfig,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(CONFIG_KEY)) {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultConfig));
    }
  }, []);
  return config;
}

export function useQuotes(): Quote[] {
  return useSyncExternalStore(
    subscribe,
    () => readQuotesFromStorage(),
    () => [],
  );
}
