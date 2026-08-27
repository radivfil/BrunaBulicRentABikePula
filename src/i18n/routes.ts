import { LOCALES, DEFAULT_LOCALE } from '../data/site.mjs';
import { withBase } from '../lib/url';

export type Locale = (typeof LOCALES)[number];
export const locales = LOCALES as readonly Locale[];
export const defaultLocale = DEFAULT_LOCALE as Locale;

/**
 * Lokalizirani segmenti ruta.
 *
 * Zašto ne isti slug na svim jezicima: njemački gost traži "fahrrad mieten
 * pula", ne "bikes". URL je rangirajući signal, a i18n bez lokaliziranih
 * slugova ostavlja polovicu prometa na stolu. Ključ je jezično neutralan
 * pa se u kodu nikad ne piše string rute ručno.
 */
export const ROUTES = {
  home: { hr: '', en: '', de: '', it: '' },
  bikes: { hr: 'bicikli', en: 'bikes', de: 'fahrraeder', it: 'biciclette' },
  tours: { hr: 'ture', en: 'tours', de: 'touren', it: 'tour' },
  prices: { hr: 'cjenik', en: 'prices', de: 'preise', it: 'prezzi' },
  equipment: { hr: 'oprema', en: 'equipment', de: 'ausruestung', it: 'attrezzatura' },
  about: { hr: 'o-nama', en: 'about', de: 'ueber-uns', it: 'chi-siamo' },
  contact: { hr: 'kontakt', en: 'contact', de: 'kontakt', it: 'contatti' },
  terms: { hr: 'uvjeti-najma', en: 'rental-terms', de: 'mietbedingungen', it: 'condizioni' },
  booking: { hr: 'rezervacija', en: 'booking', de: 'buchung', it: 'prenotazione' },
} as const;

export type RouteKey = keyof typeof ROUTES;

/**
 * Gradi apsolutnu putanju: path('en', 'bikes', 'apache-hupahu')
 *   → /en/bikes/apache-hupahu/            (produkcija, korijen domene)
 *   → /repo/en/bikes/apache-hupahu/       (demo na GitHub Pagesu)
 */
export function path(locale: Locale, key: RouteKey = 'home', slug?: string): string {
  const segment = ROUTES[key][locale];
  const parts = [locale, segment, slug].filter(Boolean);
  return withBase(`/${parts.join('/')}/`);
}

/** Ista stranica na drugom jeziku — za prebacivač jezika i hreflang. */
export function translatePath(locale: Locale, key: RouteKey, slug?: string) {
  return path(locale, key, slug);
}

/** Sve jezične varijante jedne stranice, za <link rel="alternate">. */
export function alternates(key: RouteKey, slug?: string) {
  return locales.map((l) => ({ locale: l, href: path(l, key, slug) }));
}

/** Izvlači jezik iz URL-a; fallback na zadani. Preskače base segment. */
export function localeFromUrl(url: URL): Locale {
  const parts = url.pathname.split('/').filter(Boolean);
  const found = parts.find((p) => (locales as readonly string[]).includes(p));
  return (found as Locale) ?? defaultLocale;
}
