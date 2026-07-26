import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentLedger — Rent collection and tenant management",
  description: "Track tenants, collect rent, and verify payments in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
