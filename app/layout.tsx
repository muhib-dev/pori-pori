import "./globals.css";

import type { Metadata, Viewport } from "next";
import { AppBoot } from "@/components/InstallPWA";
import { Backdrop } from "@/components/Backdrop";
import { THEME_BOOT_SCRIPT } from "@/lib/themes";

export const metadata: Metadata = {
  title: "পড়ি পড়ি (Pori Pori)",
  description: "Learn to read with little games. Works offline.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "পড়ি পড়ি" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};
export const viewport: Viewport = {
  themeColor: "#FFF6E3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // no pinch-zoom: little hands zoom by accident
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <Backdrop />
        <AppBoot />
        <main className="min-h-full max-w-2xl md:max-w-4xl mx-auto px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
