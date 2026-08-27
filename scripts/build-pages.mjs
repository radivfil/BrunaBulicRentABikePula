/**
 * Demo build za GitHub Pages.
 *
 * Produkcijski build (`npm run build`) ostaje netaknut — on gađa korijen
 * domene rentabikepula.com. Pages servira s /ime-repoa/, pa ovaj build
 * postavi `base` i označi sve stranice s noindex da se demo nikad ne
 * pojavi u Googleu uz pravu stranicu.
 *
 * Zašto node skripta, a ne `PAGES_BASE=… astro build` u package.json:
 * takav zapis ne radi u cmd.exe ni u PowerShellu, a Git Bash na Windowsu
 * dodatno pretvara vrijednosti koje počinju s '/' u Windows putanje.
 * Ovako radi svugdje i bez ijedne nove ovisnosti.
 *
 *   node scripts/build-pages.mjs [ime-repoa] [github-korisnik]
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.argv[2] ?? 'BrunaBulicRentABikePula';
const user = process.argv[3] ?? 'radivfil';

const res = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PAGES_BASE: repo,                      // bez vodeće kose crte, vidi astro.config.mjs
    PAGES_SITE: `https://${user}.github.io`,
    PUBLIC_DEMO: '1',
  },
});

if (res.status !== 0) process.exit(res.status ?? 1);

spawnSync('node', ['scripts/emit-api-data.mjs'], { stdio: 'inherit', shell: true });

// Bez .nojekyll GitHub Pages ignorira sve mape koje počinju s '_',
// a Astro sve svoje assete stavlja upravo u /_astro/ — stranica bi
// se učitala bez ijednog stila i bez ijedne slike.
writeFileSync(join('dist', '.nojekyll'), '');

console.log(`\nDemo build gotov → https://${user}.github.io/${repo}/`);
console.log('Objava:  cd dist && git init -b gh-pages && git add -A && git commit -m deploy \\');
console.log(`         && git push -f https://github.com/${user}/${repo}.git gh-pages`);
