/**
 * Nakon builda ispisuje `dist/api/data.json` — cjenik u obliku koji čita
 * PHP end-point.
 *
 * Zašto: iznos koji stigne iz preglednika NE SMIJE biti izvor istine za
 * naplatu. Bez ovoga bi svatko mogao poslati `total: 1` i platiti euro za
 * tjedan dana e-bikea. PHP zato ponovno izračuna cijenu iz istih podataka
 * iz kojih ju je izračunao i widget, pa se dvije brojke moraju poklopiti.
 *
 * Datoteka se generira, ne održava ručno — ne može se raziću s cjenikom.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BIKES_DIR = join(ROOT, 'src/content/bikes');
const OUT_DIR = join(ROOT, 'dist/api');

/** Frontmatter je strojno generiran i ima stabilan oblik — dovoljan je ovaj izvlakač. */
function field(src, name) {
  const m = src.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^"|"$/g, '') : null;
}

function priceTable(src) {
  const block = src.match(/^pricing:\n((?:\s{2}\w+:\s*[\d.]+\n)+)/m);
  if (!block) return null;
  const out = {};
  for (const line of block[1].trim().split('\n')) {
    const [k, v] = line.trim().split(':');
    out[k] = Number(v);
  }
  return out;
}

const bikes = {};
for (const file of readdirSync(BIKES_DIR).filter((f) => f.endsWith('.md'))) {
  const src = readFileSync(join(BIKES_DIR, file), 'utf8');
  const id = file.replace(/\.md$/, '');
  bikes[id] = {
    sku: field(src, 'sku'),
    fleetSize: Number(field(src, 'fleetSize')),
    pricing: priceTable(src),
  };
}

// Isti brojevi kao u src/data/pricing.ts. Izvučeni iz izvora, ne prepisani,
// da se ne mogu raziću.
const pricingSrc = readFileSync(join(ROOT, 'src/data/pricing.ts'), 'utf8');

function extractRecords(constName) {
  const start = pricingSrc.indexOf(`export const ${constName}`);
  if (start === -1) return [];
  const slice = pricingSrc.slice(start);
  const end = slice.indexOf('\n];');
  const body = slice.slice(0, end);
  const out = [];
  const re = /\{\s*id:\s*'([^']+)',[\s\S]*?(?:perDay:\s*(\{[^}]*\})|price:\s*(\d+))/g;
  let m;
  while ((m = re.exec(body))) {
    if (m[2]) {
      const table = {};
      for (const pair of m[2].replace(/[{}]/g, '').split(',')) {
        const [k, v] = pair.split(':').map((s) => s.trim());
        if (k) table[k] = Number(v);
      }
      out.push({ id: m[1], perDay: table });
    } else {
      out.push({ id: m[1], price: Number(m[3]) });
    }
  }
  return out;
}

const depositPct = Number(pricingSrc.match(/DEPOSIT_PCT\s*=\s*(\d+)/)?.[1] ?? 30);

const data = {
  generatedAt: new Date().toISOString(),
  currency: 'eur',
  depositPct,
  tiers: [
    { key: 'd1', minDays: 1 },
    { key: 'd2', minDays: 2 },
    { key: 'd4', minDays: 4 },
    { key: 'd7', minDays: 7 },
    { key: 'd14', minDays: 14 },
  ],
  bikes,
  extras: extractRecords('EXTRAS'),
  delivery: extractRecords('DELIVERY_ZONES'),
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2), 'utf8');
console.log(
  `api/data.json: ${Object.keys(bikes).length} bicikala, ${data.extras.length} stavki opreme, ${data.delivery.length} zona dostave`
);
