import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Taskaro — Personal Task Management",
  description:
    "Lightweight, high-polish personal task tracker built with Next.js and Firebase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
