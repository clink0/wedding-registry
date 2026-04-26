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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}