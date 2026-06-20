import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get('locale')?.value;
  const locale = (locales as readonly string[]).includes(cookieLocale ?? '')
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
