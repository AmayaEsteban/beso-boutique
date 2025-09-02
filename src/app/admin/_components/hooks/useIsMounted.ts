// src/app/admin/_components/hooks/useIsMounted.ts
"use client";
import { useEffect, useState } from "react";

export function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
