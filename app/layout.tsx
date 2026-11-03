import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { themeBootstrap, themeDefaultsCSS } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Line Filter — Filter & Replace",
  description:
    "Filter lines and replace text in a private, focused workspace. All processing stays in your browser.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeDefaultsCSS }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
