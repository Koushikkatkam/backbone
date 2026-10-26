import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project Backbone — Agricultural Technology & Farmgate Network | Telangana Pilot",
  description:
    "Decentralized agricultural operations network connecting smallholder farmers in Warangal and Mulugu with vertical hydroponics, poly-canopies, solar fertigation, and guaranteed 24-hour instant settlements.",
  keywords: [
    "agritech",
    "hydroponics",
    "Telangana",
    "Warangal",
    "Mulugu",
    "smallholder farmers",
    "solar fertigation",
    "instant settlement",
    "traceability",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#F8F9F6] text-[#0F1D2F]">
        {children}
      </body>
    </html>
  );
}
