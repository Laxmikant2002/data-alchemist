import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "../lib/DataContext";
import Navigation from "../components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Data Alchemist - AI Resource Allocation Configurator",
  description: "Transform messy spreadsheets into clean, validated data with AI-powered validation and business rules",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <DataProvider>
          <Navigation />
          <main className="min-h-screen pt-16">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  );
}
