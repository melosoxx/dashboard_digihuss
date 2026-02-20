"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "wwh-clarity-quota";
const MAX_CALLS = 10;

interface QuotaState {
  date: string;
  count: number;
  exhaustedByApi: boolean;
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function readQuota(): QuotaState {
  if (typeof window === "undefined")
    return { date: getTodayUTC(), count: 0, exhaustedByApi: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayUTC(), count: 0, exhaustedByApi: false };
    const state = JSON.parse(raw) as QuotaState;
    if (state.date !== getTodayUTC()) {
      return { date: getTodayUTC(), count: 0, exhaustedByApi: false };
    }
    return state;
  } catch {
    return { date: getTodayUTC(), count: 0, exhaustedByApi: false };
  }
}

function writeQuota(state: QuotaState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

let cachedSnapshot: QuotaState = readQuota();

function getSnapshot(): QuotaState {
  return cachedSnapshot;
}

function getServerSnapshot(): QuotaState {
  return { date: getTodayUTC(), count: 0, exhaustedByApi: false };
}

export function useClarityQuota() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const recordSuccess = useCallback(() => {
    const current = readQuota();
    const next: QuotaState = {
      date: getTodayUTC(),
      count: current.count + 1,
      exhaustedByApi: false,
    };
    writeQuota(next);
    cachedSnapshot = next;
    emitChange();
  }, []);

  const recordRateLimit = useCallback(() => {
    const current = readQuota();
    const next: QuotaState = {
      ...current,
      date: getTodayUTC(),
      exhaustedByApi: true,
    };
    writeQuota(next);
    cachedSnapshot = next;
    emitChange();
  }, []);

  const remaining = Math.max(0, MAX_CALLS - state.count);
  const used = state.count;
  const exhausted = state.exhaustedByApi || remaining === 0;

  return { remaining, used, max: MAX_CALLS, exhausted, recordSuccess, recordRateLimit };
}
