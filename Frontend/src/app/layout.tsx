import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHAT APP - by Devasheesh Upreti",
  description: "CHAT APP - by Devasheesh Upreti. A premium, real-time messaging and chat application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-50 text-slate-900`}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
