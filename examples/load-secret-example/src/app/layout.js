import './globals.css';

export const metadata = {
  title: 'CHT Next Versions Example',
  description: 'Example app showing version-based deployments',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
