export const metadata = {
  title: "PinPoint",
  description: "Crowdsourced infrastructure hazard reporting",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
