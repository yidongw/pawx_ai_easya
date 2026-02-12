import type { Metadata } from 'next';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import TurnstileProtection from '@/components/TurnstileProtection';
import { Toaster } from '@/components/ui/sonner';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/i18nNavigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Providers } from './providers';
import '@/styles/global.css';

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      url: '/favicon.jpg',
    },
  ],
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Using internationalization in Client Components
  const messages = await getMessages();

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.

  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers cookies={cookies}>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
          >
            <PostHogProvider>
              <TurnstileProtection
                invisibleSiteKey={Env.NEXT_PUBLIC_INVISIBLE_TURNSTILE_SITE_KEY}
                managedSiteKey={Env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              >
                {props.children}
              </TurnstileProtection>
            </PostHogProvider>
          </NextIntlClientProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
