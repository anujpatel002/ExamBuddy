import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./styles/mobile-emergency-fix.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from "react-hot-toast";

const poppins = Poppins({ subsets: ["latin"], weight: ['400', '600', '700'] });

export const metadata: Metadata = {
  title: "ExamBuddy",
  description: "Smart Exam Preparation Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  maxWidth: '90vw',
                },
                success: {
                  duration: 3000,
                },
                error: {
                  duration: 4000,
                },
              }}
              containerStyle={{
                top: 20,
              }}
            />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}