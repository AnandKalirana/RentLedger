import type { Metadata } from "next";
import "@fontsource-variable/rethink-sans";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import "./tokens.css";
import "./base.css";
import { ToastProvider } from "@/components/ui/Toast";
import { QueryProvider } from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "RentLedger — Rent collection and tenant management",
  description: "Track tenants, collect rent, and verify payments in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
