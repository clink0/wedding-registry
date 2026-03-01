import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iris & Luke — Wedding Registry",
  description: "Wedding registry for Iris and Luke, June 7th 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}