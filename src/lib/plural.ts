/**
 * Množina imenice "bicikl" po jezicima.
 *
 * Hrvatski ima tri oblika i pravilo nije "1 vs ostalo":
 *   1, 21, 101  → bicikl
 *   2–4, 22–24  → bicikla
 *   5–20, 25…   → bicikala
 * Iznimka su 11–14, koji uvijek idu na treći oblik.
 *
 * Bez ovoga na kartici kategorije piše "2 bicikala", što svaki gost
 * kojem je hrvatski materinji odmah primijeti.
 *
 * Funkcija se koristi i u Astro komponentama i u CatalogFilters islandu,
 * pa je namjerno bez ovisnosti — u klijentski bundle ode ~200 bajta.
 */

export type PluralLocale = 'hr' | 'en' | 'de' | 'it';

/** Indeks oblika u nizu `BIKE_FORMS[locale]`. */
export function pluralIndex(n: number, locale: PluralLocale): number {
  if (locale !== 'hr') return n === 1 ? 0 : 1;

  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 0;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1;
  return 2;
}

export const BIKE_FORMS: Record<PluralLocale, string[]> = {
  hr: ['bicikl', 'bicikla', 'bicikala'],
  en: ['bike', 'bikes'],
  de: ['Fahrrad', 'Fahrräder'],
  it: ['bicicletta', 'biciclette'],
};

/** "1 bicikl" · "2 bicikla" · "7 bicikala" */
export function bikeCount(n: number, locale: PluralLocale): string {
  return `${n} ${BIKE_FORMS[locale][pluralIndex(n, locale)]}`;
}
