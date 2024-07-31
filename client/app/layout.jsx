import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata = {
  title: "CodeHost",
  description: "CodeHost is a platform for developers to host frontend code.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={GeistMono.className}>{children}</body>
    </html>
  );
}
