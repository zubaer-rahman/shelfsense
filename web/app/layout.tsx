import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShelfSense | Smart Inventory & Demand Forecasting",
  description:
    "Automated expiry tracking, dynamic reorder suggestions, and demand forecasting for modern retail.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
