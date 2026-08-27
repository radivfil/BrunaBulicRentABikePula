# Rent a Bike Pula — redizajn

Astro 7 · statični build · HR / EN / DE / IT · booking island (Preact) · Stripe preko PHP end-pointa

Zamjena za postojeći rentabikepula.com (Bootstrap 3 predložak, jedna `.php`
datoteka po biciklu po jeziku, cjenici u skeniranim PDF-ovima).

---

## Pokretanje

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/  (+ dist/api/data.json)
npm run preview    # provjera build izlaza lokalno
npm run redirects  # regenerira public/.htaccess iz rute-mape
```

## Deploy na postojeći shared hosting

1. `npm run build`
2. FTP-om prebaci **cijeli sadržaj `dist/`** u web root (`public_html/`).
   `.htaccess` je uključen i nosi svih 138 301-preusmjeravanja sa starih
   `.php` adresa — bez njega redizajn briše postojeći ranking.
3. Provjeri da server ima uključen `mod_headers` i `mod_deflate`
   (obično ima; ako nema, stranica i dalje radi, samo bez keširanja).

Stara struktura ostaje netaknuta dok ne prebaciš — ništa se ne briše.

## Uključivanje Stripea (kad se odluči)

Trenutno je booking u **demo načinu**: kalendar, cijene i sažetak rade,
plaćanje ne. Da se upali:

1. Stripe Dashboard → Developers → API keys → Secret key.
2. Kopiraj `api/config.sample.php` u `api/config.php` **na serveru** i upiši
   ključ. Ta datoteka nikad ne ide u repozitorij (`.gitignore`).
3. U `src/components/pages/BikeDetail.astro` promijeni:
   ```diff
   - data-booking-mode="demo"
   - data-booking-endpoint=""
   + data-booking-mode="live"
   + data-booking-endpoint="/api/checkout.php"
   ```
4. `npm run build` i ponovni deploy.

Test karticom `4242 4242 4242 4242` uz `sk_test_…` ključ prije nego što ide
`sk_live_…`.

**Server ne vjeruje iznosu iz preglednika.** `api/checkout.php` ponovno
izračunava cijenu iz `api/data.json` (generira ga build) i odbija zahtjev ako
se ne poklopi. Bez toga bi se tjedan dana e-bikea moglo platiti euro.

### Nadogradnja na punu dostupnost

Danas `api/checkout.php` čita zauzeća iz `api/bookings.json` (flota minus
rezervirano). Kad zatreba prava baza, mijenja se **samo** funkcija
`availabilityFor()` — ugovor prema pregledniku ostaje isti i frontend se ne
dira. SQLite je na ovom hostingu sasvim dovoljan.

---

## Struktura

```
src/
├─ content.config.ts          shema kolekcija (Zod)
├─ content/
│  ├─ bikes/*.md              20 modela; prijevodi UNUTAR datoteke
│  └─ tours/*.md              3 ture — cijeli sadržaj je prijedlog
├─ data/
│  ├─ site.mjs                NAP, radno vrijeme, geo, društvene mreže
│  ├─ pricing.ts              ⚠ DRAFT cijene + tarifni razredi
│  └─ terms.ts                uvjeti najma i otkazivanja, 4 jezika
├─ i18n/
│  ├─ routes.ts               lokalizirani slugovi (bicikli/bikes/…)
│  └─ ui.ts                   svi UI stringovi; `hr` je izvor istine
├─ islands/                   JEDINI klijentski JS
│  ├─ BookingWidget.tsx       client:load — kalendar, cijena, CTA
│  ├─ AvailabilityCalendar.tsx  ~3 kB, pisan od nule
│  ├─ CatalogFilters.tsx      client:visible — skriva već otisnute kartice
│  └─ lib/api.ts              jedina točka dodira s backendom
├─ components/pages/          tijelo svake stranice
└─ pages/
   ├─ index.astro             razdjelnik jezika (noindex)
   ├─ [lang]/index.astro      naslovnica
   ├─ [lang]/[section]/       katalog, ture, cjenik, oprema, o nama…
   └─ [lang]/[section]/[item] detalj bicikla / ture
```

Zašto `[section]` dispatcher, a ne mape po jeziku: slugovi su lokalizirani, a
Astro rute su nazivi mapa na disku — jedna mapa ne može imati četiri imena.
Alternativa bi bila 4 × 8 = 32 gotovo identične datoteke.

## Izmjena sadržaja

| Što | Gdje |
|---|---|
| Cijena bicikla | `src/content/bikes/<model>.md` → `pricing:` |
| Novi bicikl | nova `.md` u `src/content/bikes/` + slika u `src/assets/bikes/` |
| Cijene opreme i dostave | `src/data/pricing.ts` |
| Telefon, adresa, radno vrijeme | `src/data/site.mjs` |
| Tekstovi sučelja | `src/i18n/ui.ts` |
| Uvjeti najma | `src/data/terms.ts` |

Svaka promjena traži `npm run build` i novi deploy.

---

## Mjereno na ovom buildu

| | HTML (gzip) | JS (gzip) |
|---|---|---|
| Naslovnica | 7,4 kB | **0 kB** |
| Katalog | 9,9 kB | 11,1 kB |
| Detalj bicikla | 10,3 kB | 14,2 kB |

CSS je jedna keširana datoteka od 8,0 kB gzip. Hero slika je AVIF: 43 kB na
mobitelu, 153 kB na desktopu (original je bio 1,1 MB JPEG).

- Fontovi self-hostani, subset `latin-ext` (bez njega č/ć/š/ž/đ padnu na
  fallback i naslovi poskoče → CLS).
- Sve slike imaju fiksni omjer → CLS ≈ 0.
- Bez Google karte, bez cookie bannera, bez analitike trećih strana.

## SEO

- `LocalBusiness` + `SportingGoodsStore` na svakoj stranici, fiksni `@id`.
- `Product` + `AggregateOffer` s `UnitPriceSpecification` (dnevna tarifa, ne
  prodajna cijena bicikla) po modelu; `TouristTrip` po turi; `BreadcrumbList`.
- `hreflang` za sva četiri jezika + `x-default` na svakoj stranici.
- Cjenik je HTML tablica, ne PDF — indeksabilan i čitljiv na mobitelu.
- `aggregateRating` je **namjerno izostavljen** dok se ne potvrde brojke s
  TripAdvisora. Izmišljena ocjena je razlog za ručnu kaznu.

---

## ⚠ Traži potvrdu klijenta prije objave

1. **Cijene.** Sve u `src/data/pricing.ts` i u `pricing:` svakog bicikla su
   tržišna procjena. Cjenici na starom webu su skenirani PDF-i iz 2024. i ne
   mogu se strojno pročitati. Struktura razreda (1 / 2+ / 4+ / 7+ / 14+ dana)
   JEST preuzeta iz originala.
2. **Specifikacije.** Polja označena u `needsReview:` (motor, baterija, domet,
   broj brzina, kočnice) su procjena iz fotografija — stari web nije imao
   nikakve specifikacije. Prikazuju se s vidljivom napomenom.
3. **Ture ne postoje.** Sve tri su prijedlog, označene `isDraft: true` i
   prikazane s upozorenjem. Obrisati ili zamijeniti stvarnima.
4. **Uvjeti najma** (`src/data/terms.ts`) su prerada engleskog originala —
   na provjeru pravnoj osobi i uskladiti s uvjetima koje klijent već ima
   za listnride.
5. **Koordinate** u `site.mjs` su centroid Šišana, ne točan ulaz u servis.
6. **OIB** nedostaje u podnožju (`TODO`).
7. **Broj godina iskustva** („25+" u hero-u) i **grupni popust** (stari web je
   na jednoj stranici pisao 10+, na drugoj 20+ bicikala) — potvrditi.
8. **Fotografije.** Preuzete sa starog weba: bicikli su čisti studijski
   izresci 800×800 i izgledaju dobro, ali su banneri jako HDR-ani i malih
   dimenzija. Nove fotografije bi najviše podigle dojam.

## Namjerno izostavljeno

- **Google karta.** Njezin iframe povuče ~900 kB JS-a treće strane, sruši
  Lighthouse i traži cookie privolu. Umjesto nje je kartica s linkom na
  navigaciju — gost ionako želi rutu na svom telefonu.
- **ES / FR / NL.** Stari web ih je imao; 301 na `/en/`. Struktura podnosi
  povratak: jedan objekt u `ui.ts` i jedan stupac u `i18n:` svakog bicikla.
- **`racing-3a`.** Na starom webu je imao slomljenu sliku (`.jpg` vraća 404),
  pa nije prenesen. Njegov stari URL vodi na katalog cestovnih bicikala.
- **Rezervacija tura kroz kalendar.** Broj polaznika i termin vodiča
  dogovaraju se razgovorom; kalendar koji ne može ispuniti obećanje je gori
  od jasnog poziva na kontakt.
