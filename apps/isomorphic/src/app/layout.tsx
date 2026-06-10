import { Toaster } from 'react-hot-toast';
import GlobalDrawer from '@/app/shared/drawer-views/container';
import GlobalModal from '@/app/shared/modal-views/container';
import { JotaiProvider, ThemeProvider } from '@/app/shared/theme-provider';
import I18nProvider from '@/i18n/provider';
import { siteConfig } from '@/config/site.config';
import { inter, lexendDeca } from '@/app/fonts';
import cn from '@core/utils/class-names';
import NextProgress from '@core/components/next-progress';
import ProtectedRoute from '@/components/ProtectedRoute';

// styles
import 'swiper/css';
import 'swiper/css/navigation';
import '@/app/globals.css';

export const metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      dir="ltr"
      // Direction fixée sur LTR pour le Cabinet d'Immigration
      suppressHydrationWarning
    >
      <body
        // to prevent any warning that is caused by third party extensions like Grammarly
        suppressHydrationWarning
        className={cn(inter.variable, lexendDeca.variable, 'font-inter')}
      >
        <ThemeProvider>
          <NextProgress />
          <JotaiProvider>
            <I18nProvider>
              <ProtectedRoute>
                {children}
                <Toaster />
                <GlobalDrawer />
                <GlobalModal />
              </ProtectedRoute>
            </I18nProvider>
          </JotaiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
