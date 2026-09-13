import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리의 달력 | 현쪼기 & 쩡개굴",
  description: "현쪼기와 쩡개굴이 함께 채워가는 공유 캘린더",
  robots: { index: false, follow: false },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
