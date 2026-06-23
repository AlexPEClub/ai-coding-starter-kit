import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZUSAMMEN",
  description: "Gemeinsam planen, abstimmen und Erinnerungen teilen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={archivo.variable}>
      <body className="antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
