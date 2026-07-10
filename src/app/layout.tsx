import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TennisPro - Gestão de Torneios",
  description: "Plataforma completa para gestão de torneios e campeonatos esportivos",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}