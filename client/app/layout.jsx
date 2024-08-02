import { getServerSession } from "next-auth";
import { GeistMono } from "geist/font/mono";
import SessionProvider from "./components/SessionProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";

export const metadata = {
  title: "CodeHost",
  description: "CodeHost is a platform for developers to host frontend code.",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className={`${GeistMono.className} min-h-screen`}>
        <SessionProvider session={session}>
          <Navbar />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
