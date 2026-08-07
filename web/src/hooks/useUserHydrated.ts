"use client";

import { useSyncExternalStore } from "react";

import { useUserStore } from "@/stores/userStore";

const subscribe = (callback: () => void): (() => void) =>
  useUserStore.persist.onFinishHydration(callback);

const getClientSnapshot = (): boolean => useUserStore.persist.hasHydrated();

const getServerSnapshot = (): boolean => false;

export function useUserHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
