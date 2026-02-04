import "./globals.css";
import Footer from '@/components/Footer';

export const metadata = {
  title: "OPTIR Reservation | PICSSL Lab",
  description: "Reserve time for Optical Photothermal IR Spectroscopy at PICSSL Lab, York University",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
