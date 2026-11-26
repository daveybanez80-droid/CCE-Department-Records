import type { Metadata, Viewport } from "next";
import { Archivo, Public_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${archivo.variable} ${publicSans.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <Link href="#main" className="skip-link">
          Skip to main content
        </Link>
        {children}
      </body>
    </html>
  );
}
