import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YT-Sum 知識導航儀 — 前置觀念・核心拆解・延伸研究",
  description: "使用 Google Gemini API 拆解 YouTube 影片的前置知識、核心觀念與延伸學習路線。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
