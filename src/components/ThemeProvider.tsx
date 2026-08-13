"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemeProviderProps } from "next-themes";
import { usePathname } from "next/navigation";

type ThemeProviderProps = React.PropsWithChildren<Omit<NextThemeProviderProps, 'children'>>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  
  const isDashboardPage = pathname.includes("/managers") || 
                          pathname.includes("/tenants") || 
                          pathname.includes("/admin");

  
  React.useEffect(() => {
    setMounted(true);
    
    
    if (!isDashboardPage && window && document) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDashboardPage]);

  
  const themeProps = {
    ...props,
    forcedTheme: !isDashboardPage ? 'light' : undefined,
  };

  
  
  return (
    <NextThemesProvider {...themeProps}>
      <div suppressHydrationWarning>
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
      </div>
    </NextThemesProvider>
  );
}
