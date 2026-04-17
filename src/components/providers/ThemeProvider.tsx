"use client";

import * as React from "react";
import { useAppStore } from "@/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = 'dark';
  }, []);

  return <>{children}</>;
}


