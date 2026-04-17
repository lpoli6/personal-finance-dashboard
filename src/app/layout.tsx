import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance — Personal Wealth OS",
  description: "A smoother way to track net worth, budget, and plan for financial independence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="h-full bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-100">
        <ThemeProvider>
          <TooltipProvider>
            <div className="relative min-h-full">
              <Sidebar />
              <main className="md:pl-60 min-h-full pb-20 md:pb-0">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
