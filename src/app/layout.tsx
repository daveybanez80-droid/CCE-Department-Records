import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "College of Computer Education — Department Records",
    template: "%s — College of Computer Education",
  },
  description:
    "Student records and department inventory for the College of Computer Education, Andres Soriano Colleges of Bislig.",
  applicationName: "CCE Department Records",
};

export const viewport: Viewport = {
  themeColor: "#0F2A4A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <body className="bg-paper text-ink font-sans antialiased">
        <Link href="#main" className="skip-link">
          Skip to main content
        </Link>
        {children}
      </body>
    </html>
  );
}