import { getServerSession } from "next-auth";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { authConfig } from "@/lib/auth";
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";
import SessionProvider from "@/app/components/SessionProvider";
import ToastProvider from "@/app/components/ToastProvider";

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
        className={`${GeistMono.className} ${GeistSans.variable} flex min-h-screen flex-col`}
      >
        <SessionProvider session={session}>
          <Navbar />
          <div className="mx-auto w-full max-w-screen-xl">{children}</div>
          <Footer />
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  );
}
