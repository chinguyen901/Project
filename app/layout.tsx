import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chi Nguyen — Products & Tools",
  description:
    "Automation tools, 5G OAM demos, and side projects by Chi Nguyen Quoc — Software Engineer & Automation Specialist.",
  keywords: [
    "automation",
    "Python",
    "scraping",
    "5G OAM",
    "NETCONF",
    "TMA Solutions",
    "freelance",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
