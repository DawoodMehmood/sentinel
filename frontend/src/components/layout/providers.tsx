'use client';

import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {

  return (
    
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        enableSystem={false}
        defaultTheme="light"
      >
        <Toaster />
      <ActiveThemeProvider initialTheme={activeThemeValue}>
          {children}
      </ActiveThemeProvider>
    
      </ThemeProvider>
    </SessionProvider>
  );
}
