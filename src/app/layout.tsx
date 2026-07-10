import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SD Inpres Nggodimeda — LMS",
  description: "Sistem belajar daring SD Inpres Nggodimeda — ceria, ramah anak, dan terhubung.",
  openGraph: {
    title: "SD Inpres Nggodimeda — LMS",
    description: "Sistem belajar daring SD Inpres Nggodimeda — ceria, ramah anak, dan terhubung.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
