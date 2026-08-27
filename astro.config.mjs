// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

import { SITE_URL } from './src/data/site.mjs';

// Demo build za GitHub Pages: `npm run build:pages` postavi PAGES_BASE i
// stranica se onda servira s /ime-repoa/ umjesto s korijena domene.
// Produkcijski build (za shared hosting) ostaje potpuno nepromijenjen.
const PAGES_BASE = process.env.PAGES_BASE;
const PAGES_SITE = process.env.PAGES_SITE;

// Statični build: hosting je klasični shared/Apache, bez Node runtimea.
// Sve rute su prerenderane u .html, a jedini dinamični dio (Stripe) živi
// u zasebnoj PHP end-pointi u /public/api/ koja se deploya uz statiku.
export default defineConfig({
  site: PAGES_SITE ?? SITE_URL,
  ...(PAGES_BASE ? { base: PAGES_BASE } : {}),
  output: 'static',
  trailingSlash: 'always',

  // Namjerno NE koristimo Astro i18n routing middleware.
  // Na Apacheu bez Node-a middleware ne radi, a `[lang]` rute s
  // getStaticPaths daju identičan rezultat, potpuno predvidljivo.
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  image: {
    // Sharp lokalno pretvara sve u AVIF/WebP u build fazi; na hostingu
    // ne treba ništa jer su izlaz obični fileovi.
    //
    // responsiveStyles je NAMJERNO isključen: Astro tada svakoj slici
    // ubaci `height:auto` + aspect-ratio, što nadjača `h-full` na
    // pozadinskim slikama (hero, banner tura) i one se preliju izvan
    // sekcije. Dimenzije ovdje kontroliraju eksplicitne klase i `sizes`.
    responsiveStyles: false,
  },

  integrations: [
    preact({ compat: false }),
    // Bez `i18n` opcije: ona bi u sitemap upisala jezične alternative
    // izvedene iz prefiksa, a naši slugovi su lokalizirani (bicikli /
    // fahrraeder / biciclette) pa bi dio veza bio kriv. Točan hreflang
    // ionako stoji u <head> svake stranice, gdje ga Google i čita.
    sitemap({
      filter: (page) => !/\/(rezervacija|booking|buchung|prenotazione)\//.test(page),
    }),
  ],

  vite: {
    plugins: [tailwind()],
  },
});
