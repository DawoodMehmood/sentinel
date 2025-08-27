import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import NextTopLoader from "nextjs-toploader";
import "@/styles/dashboard-theme.css";
import Providers from "@/components/layout/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { redirect } from "next/navigation";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { cn } from '@/lib/utils';
import { Metadata, Viewport } from "next";
import { fontVariables } from '@/lib/font';
import { ThemeProvider } from "next-themes";
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: "Sentinel Dashboard",
  description: "Insights dashboard",
};

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth guard for all /dashboard/*
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/sign-in");

  // Preserve the dashboard’s theme cookie contract
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body
        className={cn(
          'dash-scope bg-background overflow-hidden overscroll-none font-sans antialiased',
          activeThemeValue ? `theme-${activeThemeValue}` : '',
          isScaled ? 'theme-scaled' : '',
          fontVariables
        )}
      >
        <NextTopLoader showSpinner={false} />
        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <Providers activeThemeValue={activeThemeValue as string}>
              <Toaster />
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar />
                <SidebarInset>
                  <Header />
                  {children}
                </SidebarInset>
              </SidebarProvider>
            </Providers>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </>
  );
}
