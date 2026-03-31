import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FEES Dokumentation",
  description: "Workflow-Tool für FEES-Befunddokumentation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body
        className={`${manrope.variable} ${inter.variable} bg-surface text-on-surface font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
