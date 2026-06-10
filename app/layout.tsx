import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { UsernameProvider } from "@/shared/context/UsernameContext";
import { SocketProvider } from "@/network/client/SocketProvider";
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
  title: "Los Pibes Que Dibujan",
  description: "Tablero multiplayer de dibujo en progreso.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-[100dvh] w-full bg-background">
        <AppRouterCacheProvider>
          <UsernameProvider>
            <SocketProvider>{children}</SocketProvider>
          </UsernameProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
