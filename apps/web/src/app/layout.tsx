import type { Metadata } from "next";
import "./globals.css";
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
