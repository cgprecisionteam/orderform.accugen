import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Accugen Dental Lab — Order Form',
  description: 'Submit a new lab order to Accugen Dental Lab',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
