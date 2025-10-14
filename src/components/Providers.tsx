"use client";

import { AppProvider } from "@/context/AppContext";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
