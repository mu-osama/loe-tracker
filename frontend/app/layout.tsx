import './globals.css';
import { AppProviders } from '@/components/AppProviders';

export const metadata = {
  title: 'PixelEDGE',
  description: 'Level of Effort tracking for a single organization',
};

export default function RootLayout({ children }: { children?: any }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
