/**
 * Produkcija je korijen domene (rentabikepula.com), ali demo na GitHub
 * Pagesu živi pod /ime-repoa/. Svaka apsolutna putanja mora proći kroz
 * ovu funkciju, inače na Pagesu pucaju fontovi, favicon i sve rute.
 *
 * `import.meta.env.BASE_URL` je '/' kad `base` nije postavljen, pa je u
 * produkcijskom buildu ovo no-op.
 */
export function withBase(p: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!base) return p;
  return `${base}${p.startsWith('/') ? p : `/${p}`}`;
}
