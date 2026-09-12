import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getAntiFoucScript } from "@/lib/theme/anti-fouc";
import { COOKIE_THEME_KEY, getServerThemeAttributes } from "@/lib/theme/storage";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPL Report",
  description: "Live Fantasy Premier League squad dashboard",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const serverTheme = getServerThemeAttributes(cookieStore.get(COOKIE_THEME_KEY)?.value);
  const htmlClassName = [
    geistSans.variable,
    geistMono.variable,
    "h-full antialiased",
    serverTheme.className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={htmlClassName}
      data-theme={serverTheme["data-theme"]}
      style={
        serverTheme.colorScheme
          ? ({ colorScheme: serverTheme.colorScheme } as CSSProperties)
          : undefined
      }
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: getAntiFoucScript() }} />
      </head>
      <body className="min-h-full font-sans transition-colors duration-200">
        <ThemeProvider>
          <div className="app-shell">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
