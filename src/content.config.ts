import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const LOCALE_KEYS = ['hr', 'en', 'de', 'it'] as const;

/**
 * Prijevodi se drže UNUTAR jedne datoteke po biciklu, ne u četiri
 * odvojene datoteke. Razlog: 90 % podataka o biciklu (cijena, brzine,
 * veličina kotača, slike, količina u floti) je jezično neutralno.
 * Razdvajanje po jeziku bi značilo 84 datoteke i četiri mjesta na
 * kojima se cijena može raziću — točno bolest koju stari web ima.
 */
const translated = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  highlights: z.array(z.string()).max(5),
});

const priceTable = z.object({
  d1: z.number().positive(),
  d2: z.number().positive(),
  d4: z.number().positive(),
  d7: z.number().positive(),
  d14: z.number().positive(),
});

const bikes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/bikes' }),
  schema: ({ image }) =>
    z.object({
      sku: z.string(),
      category: z.enum(['e-bike', 'mtb', 'city', 'kids', 'racing']),
      brand: z.string(),
      order: z.number().default(50),
      featured: z.boolean().default(false),

      /** Broj komada u floti — temelj izračuna dostupnosti. */
      fleetSize: z.number().int().positive(),

      specs: z.object({
        wheel: z.enum(['16', '20', '24', '26', '27.5', '28', '29']),

        /*
         * Ova polja su ŠIFRE, ne slobodan tekst.
         *
         * Prije su bila obicni stringovi ("Aluminij, hardtail"), pa su na
         * engleskoj, njemackoj i talijanskoj stranici ostajala na
         * hrvatskom. Kroz enum idu u i18n/ui.ts i prevode se sama.
         * Nova vrijednost = jedan kljuc u rjecniku, ne 20 datoteka.
         */
        frameMaterial: z.enum(['aluminium', 'steel', 'carbon']),
        frameType: z
          .enum(['hardtail', 'lowstep', 'stepthrough', 'trekking', 'fully', 'monotube', 'classic'])
          .optional(),
        gears: z.number().int().positive().optional(),
        suspension: z.enum(['rigid', 'hardtail', 'full']).optional(),
        brakes: z.enum(['hydraulic-disc', 'disc', 'v-brake', 'rim']).optional(),
        motor: z.enum(['mid-250']).optional(),
        battery: z.enum(['integrated']).optional(),
        /** "60–90 km" — brojevi i jedinica, jezicno neutralno. */
        range: z.string().optional(),
        weight: z.number().optional(),
        sizes: z.array(z.enum(['XS', 'S', 'M', 'L', 'XL', 'one'])),
        riderHeight: z.tuple([z.number(), z.number()]).optional(),
      }),

      /** Cijena po danu za svaki tarifni razred. ⚠ DRAFT, vidi data/pricing.ts */
      pricing: priceTable,

      image: image(),
      /**
       * `cutout` = studijski izrezak na bijeloj pozadini (18 od 20 slika):
       *   renderira se s `object-contain` i mix-blend-multiply, pa se
       *   bijela stopi s toniranom karticom.
       * `photo`  = obicna fotografija s pozadinom (cestovni bicikli):
       *   `object-cover` u okviru, BEZ multiplya — inace posivi.
       * Kad klijent posalje nove fotografije, mijenja se samo ovo polje.
       */
      imageStyle: z.enum(['cutout', 'photo']).default('cutout'),
      imageAlt: z.record(z.enum(LOCALE_KEYS), z.string()),

      i18n: z.record(z.enum(LOCALE_KEYS), translated),

      /** Podaci o ovom modelu koje klijent još nije potvrdio. */
      needsReview: z.array(z.string()).default([]),
    }),
});

const tours = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tours' }),
  schema: ({ image }) =>
    z.object({
      order: z.number().default(50),
      distanceKm: z.number(),
      ascentM: z.number(),
      durationH: z.number(),
      difficulty: z.enum(['easy', 'moderate', 'hard']),
      minPeople: z.number().int().positive(),
      pricePerPerson: z.number().positive(),
      bikeCategory: z.enum(['e-bike', 'mtb', 'city', 'racing']),
      startPoint: z.string(),
      image: image(),
      imageAlt: z.record(z.enum(LOCALE_KEYS), z.string()),
      i18n: z.record(
        z.enum(LOCALE_KEYS),
        translated.extend({ includes: z.array(z.string()) })
      ),
      /** Ture ne postoje na starom webu — cijeli sadržaj je prijedlog. */
      isDraft: z.boolean().default(true),
    }),
});

export const collections = { bikes, tours };
