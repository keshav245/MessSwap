import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MessSwap",
  description: "Hostellers share unused mess meal slots. Day scholars grab them. No meal goes to waste.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen bg-paper text-ink antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
