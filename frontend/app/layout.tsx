import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ma2bool.ai — AI Mock Interviews",
  description:
    "Practice job interviews with a real-time AI voice interviewer. Get instant scorecards with eye-contact tracking and detailed performance feedback.",
  keywords: ["AI interview", "mock interview", "job preparation", "voice AI", "eye contact"],
  openGraph: {
    title: "Ma2bool.ai — AI Mock Interviews",
    description: "Practice job interviews with real-time AI voice and eye-contact tracking.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg-base antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
