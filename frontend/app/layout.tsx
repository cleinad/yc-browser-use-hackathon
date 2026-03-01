import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proquote",
  description:
    "Enterprise parts procurement assistant with live agent-backed quotes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
