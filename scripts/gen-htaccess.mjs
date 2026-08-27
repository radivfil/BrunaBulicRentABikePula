// Generira .htaccess s 301 preusmjeravanjima sa svake stare .php adrese.
// Bez ovoga redizajn briše postojeći ranking — svaka indeksirana stranica
// stare lokacije vraćala bi 404.
import { writeFileSync } from 'node:fs';

const LOCALES = ['hr', 'en', 'de', 'it'];
const DROPPED = ['es', 'fr', 'nl']; // jezici koje više ne održavamo → EN

const SECTION = {
  bikes: { hr: 'bicikli', en: 'bikes', de: 'fahrraeder', it: 'biciclette' },
  prices: { hr: 'cjenik', en: 'prices', de: 'preise', it: 'prezzi' },
  about: { hr: 'o-nama', en: 'about', de: 'ueber-uns', it: 'chi-siamo' },
  contact: { hr: 'kontakt', en: 'contact', de: 'kontakt', it: 'contatti' },
};

// Stara kategorijska stranica → filtar na novom katalogu.
const CATEGORY = {
  'e-bikes': 'e-bike',
  'mountain-bikes': 'mtb',
  'city-bikes': 'city',
  'children-bikes': 'kids',
  'racing-bikes': 'racing',
};

// Stara .php datoteka bicikla → novi slug u kolekciji.
const BIKE = {
  'e-bike-APACHE-HUPAHU': 'apache-hupahu',
  'e-bike-APACHE-TUWAN': 'apache-tuwan',
  'e-bike-APACHE-YAMKA': 'apache-yamka',
  'e-bike-CRUSSIS': 'crussis-e-cross',
  'e-bike-VENDA-VAM': 'venda-vam-grand-touring',
  'bike-mtb-29-brb-standard-grey': 'mtb-29-stratos-grey',
  'bike-mtb-29-brb-standard-black': 'mtb-29-stratos-black',
  'bike-mtb-29-brb-seattle-hardtail-basic': 'mtb-29-seattle-hardtail',
  'bike-mtb-26-brb-hardtail-standard': 'mtb-26-hardtail-standard',
  'bike-mtb-26-brb-hystric-fully-standard-basic-blue': 'mtb-26-hystric-fully-blue',
  'bike-mtb-26-brb-hystric-fully-standard-basic-red': 'mtb-26-hystric-fully-red',
  'bike-mtb-26-hybrid-svr-monotube-standard': 'mtb-26-hybrid-svr-monotube',
  'bike-ctb-28-carratt-lady-standard': 'city-28-carratt-lady',
  'bike-ctb-28-carratt-men-standard': 'city-28-carratt-men',
  'bike-children-20-4a': 'kids-torpado-20-blue',
  'bike-children-20-4b': 'kids-torpado-20-pink',
  'bike-children-24-5a': 'kids-torpado-24-blue',
  'bike-children-24-5b': 'kids-torpado-24-pink',
  'bike-racing-carbon': 'racing-carbon',
  'bike-racing-alu': 'racing-alu',
  // racing-3a je na starom webu imao slomljenu sliku (404 na .jpg) i nije
  // prenesen u novu flotu — šaljemo ga na katalog cestovnih bicikala.
  'bike-racing-3a': null,
};

const L = [];
const R = (from, to) => L.push(`Redirect 301 ${from} ${to}`);

L.push('# ─────────────────────────────────────────────────────────────');
L.push('# Rent a Bike Pula — Apache konfiguracija');
L.push('# Generirano; ne uređivati ručno bez usklađivanja s i18n/routes.ts');
L.push('# ─────────────────────────────────────────────────────────────');
L.push('');
L.push('Options -Indexes');
L.push('DirectoryIndex index.html');
L.push('');
L.push('<IfModule mod_headers.c>');
L.push('  # Slike i fontovi imaju hash u imenu — smiju se keširati godinu dana.');
L.push('  <FilesMatch "\\.(avif|webp|jpg|jpeg|png|svg|woff2)$">');
L.push('    Header set Cache-Control "public, max-age=31536000, immutable"');
L.push('  </FilesMatch>');
L.push('  # HTML se mijenja pri svakom deployu — uvijek provjeri kod servera.');
L.push('  <FilesMatch "\\.html$">');
L.push('    Header set Cache-Control "public, max-age=0, must-revalidate"');
L.push('  </FilesMatch>');
L.push('  Header set X-Content-Type-Options "nosniff"');
L.push('  Header set Referrer-Policy "strict-origin-when-cross-origin"');
L.push('</IfModule>');
L.push('');
L.push('<IfModule mod_deflate.c>');
L.push('  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml');
L.push('</IfModule>');
L.push('');
L.push('ErrorDocument 404 /404.html');
L.push('');
L.push('# ── 301: stare .php rute ──────────────────────────────────────');
L.push('');

for (const lang of LOCALES) {
  L.push(`# ${lang.toUpperCase()}`);
  R(`/${lang}/index.php`, `/${lang}/`);

  for (const [old, cat] of Object.entries(CATEGORY)) {
    R(`/${lang}/${old}.php`, `/${lang}/${SECTION.bikes[lang]}/?kategorija=${cat}`);
  }
  for (const key of ['prices', 'about', 'contact']) {
    R(`/${lang}/${key}.php`, `/${lang}/${SECTION[key][lang]}/`);
  }
  for (const [old, slug] of Object.entries(BIKE)) {
    R(`/${lang}/${old}.php`, slug ? `/${lang}/${SECTION.bikes[lang]}/${slug}/` : `/${lang}/${SECTION.bikes[lang]}/?kategorija=racing`);
  }
  L.push('');
}

L.push('# ── Ukinuti jezici → engleski ─────────────────────────────────');
for (const lang of DROPPED) {
  L.push(`RedirectMatch 301 ^/${lang}/(.*)$ /en/`);
}
L.push('');
L.push('# ── Korijen i ostaci predloška ────────────────────────────────');
R('/index.php', '/');
for (const junk of ['casuals', 'cosmetics', 'deos', 'formals', 'haircare', 'handbags',
                    'inner', 'jewellery', 'night', 'shoes', 'skincare', 'watches',
                    'women', 'single']) {
  R(`/${junk}.html`, '/');
}

writeFileSync(process.argv[2], L.join('\n') + '\n', 'utf8');
console.log(`Zapisano ${L.filter((l) => l.startsWith('Redirect')).length} preusmjeravanja.`);
