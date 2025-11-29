/**
 * Zustand Store Initializer
 * 这是一个客户端组件，它的唯一作用是接收从服务器组件获取的初始数据，
 * 并将其加载到 Zustand store 中。它只在首次加载时执行，确保了服务器状态
 * 和客户端状态的同步。
 */

"use client";

import { useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import type { InsuranceRecord } from "@/types/insurance";

interface StoreInitializerProps {
  initialData: InsuranceRecord[];
}

export function StoreInitializer({ initialData }: StoreInitializerProps) {
  const initialized = useRef(false);

  // 这个组件的核心：确保 setRawData 只被调用一次
  if (!initialized.current) {
    useAppStore.getState().setRawData(initialData);
    initialized.current = true;
  }

  // 这个组件不渲染任何 UI
  return null;
}
