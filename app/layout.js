import { Plus_Jakarta_Sans } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata = {
  title: "PinPoint",
  description: "Crowdsourced infrastructure hazard reporting",
  icons: {
    icon: "/pinpoint-logo-pin.png",
    shortcut: "/pinpoint-logo-pin.png",
    apple: "/pinpoint-logo-pin.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}