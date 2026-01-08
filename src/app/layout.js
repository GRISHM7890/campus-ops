import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import "./globals.css";

export const metadata = {
  title: "CampusOPS | Campus Operations Intelligence",
  description: "AI-powered campus operations and intelligent automation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
