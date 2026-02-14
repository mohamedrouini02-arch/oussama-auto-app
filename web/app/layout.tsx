import AuthGuard from "@/components/AuthGuard";
import ServiceWorkerUnregister from "@/components/ServiceWorkerUnregister";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from '@/context/LanguageContext';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Oussama Auto',
  description: 'Car Inventory Management System',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Oussama Auto',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Metadata = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ServiceWorkerUnregister />
            <AuthGuard>
              {children}
            </AuthGuard>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
