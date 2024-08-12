import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

import SessionProvider from "@/app/components/SessionProvider";
import ToastProvider from "@/app/components/ToastProvider";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

import "./globals.css";

export const metadata = {
  title: "CodeHost",
  description: "CodeHost is a platform for developers to host frontend code.",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authConfig);

  return (
    <html lang="en">
      <body
        className={`${GeistMono.className} ${GeistSans.variable} min-h-screen`}
      >
        <SessionProvider session={session}>
          <Navbar />
          {children}
          <Footer />
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  );
}
