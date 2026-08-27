/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  ⚠  DRAFT CIJENE — NISU POTVRĐENE OD KLIJENTA                        │
 * │                                                                      │
 * │  Cjenici na starom webu su SKENIRANI PDF-i (PRICELIST-BIKES.pdf,     │
 * │  PRICELIST-EQUIPMENT.pdf, DELIVERY-SERVICE-PRICELIST.pdf) označeni   │
 * │  godinom 2024 — brojke se iz njih ne mogu strojno pročitati.         │
 * │                                                                      │
 * │  Vrijednosti dolje su tržišna procjena za Istru i služe SAMO da      │
 * │  demo izgleda ispravno. Prije objave: prepisati iz cjenika 2026.     │
 * │  Struktura tarifnih razreda (1 / 2+ / 4+ / 7+ / 14+ dana) JEST       │
 * │  preuzeta iz originalnog PDF-a i vjerojatno je točna.                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const PRICES_ARE_DRAFT = true;

/** Tarifni razredi iz originalnog cjenika. `minDays` je donja granica. */
export const TIERS = [
  { key: 'd1', minDays: 1 },
  { key: 'd2', minDays: 2 },
  { key: 'd4', minDays: 4 },
  { key: 'd7', minDays: 7 },
  { key: 'd14', minDays: 14 },
] as const;

export type TierKey = (typeof TIERS)[number]['key'];
/** Cijena po danu za svaki razred, u EUR. */
export type PriceTable = Record<TierKey, number>;

/** Vraća cijenu po danu za zadani broj dana najma. */
export function ratePerDay(table: PriceTable, days: number): number {
  let rate = table.d1;
  for (const tier of TIERS) {
    if (days >= tier.minDays) rate = table[tier.key];
  }
  return rate;
}

/** Ukupna cijena stavke: dani × količina × cijena po danu odgovarajućeg razreda. */
export function lineTotal(table: PriceTable, days: number, qty = 1): number {
  return ratePerDay(table, days) * days * qty;
}

/** Broj dana najma. Isti dan preuzimanja i povrata = 1 dan (vidi uvjete, t. 11). */
export function rentalDays(from: string, to: string): number {
  const a = Date.parse(from + 'T00:00:00Z');
  const b = Date.parse(to + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

/** Ušteda u postotku u odnosu na jednodnevnu cijenu — koristi se kao bedž. */
export function savingsPct(table: PriceTable, days: number): number {
  if (table.d1 <= 0) return 0;
  return Math.round((1 - ratePerDay(table, days) / table.d1) * 100);
}

/**
 * Popust na veće količine. Stari web je oglašavao "10% off na 20+ bicikala"
 * (na jednoj stranici je pisalo 10+, na drugoj 20+ — TODO: potvrditi).
 */
export const GROUP_DISCOUNT = { minBikes: 20, pct: 10 };

/** Udio ukupnog iznosa koji se plaća online kao akontacija. */
export const DEPOSIT_PCT = 30;

type L10n = { hr: string; en: string; de: string; it: string };

/**
 * DRAFT — dodatna oprema. Popis stavki JE preuzet iz PRICELIST-EQUIPMENT.pdf,
 * cijene nisu (u PDF-u su nečitljive). Nazivi su ovdje, uz podatke, a ne u
 * i18n/ui.ts — jer je ovo katalog, ne sučelje: kad klijent doda novu stavku,
 * dodaje je na jednom mjestu.
 */
export const EXTRAS: Array<{
  id: string;
  perDay: PriceTable;
  maxQty: number;
  /** Prikazuje li se u booking widgetu (true) ili samo na stranici opreme. */
  inBooking: boolean;
  label: L10n;
}> = [
  { id: 'helmet', perDay: { d1: 4, d2: 3, d4: 3, d7: 2, d14: 2 }, maxQty: 10, inBooking: true,
    label: { hr: 'Kaciga', en: 'Helmet', de: 'Helm', it: 'Casco' } },
  { id: 'child-seat', perDay: { d1: 6, d2: 5, d4: 4, d7: 4, d14: 3 }, maxQty: 4, inBooking: true,
    label: { hr: 'Dječja sjedalica', en: 'Child seat', de: 'Kindersitz', it: 'Seggiolino' } },
  { id: 'basket', perDay: { d1: 3, d2: 2, d4: 2, d7: 2, d14: 1 }, maxQty: 6, inBooking: true,
    label: { hr: 'Košara', en: 'Basket', de: 'Korb', it: 'Cestino' } },
  { id: 'trailer', perDay: { d1: 14, d2: 12, d4: 10, d7: 9, d14: 8 }, maxQty: 2, inBooking: false,
    label: { hr: 'Dječja / pseća prikolica', en: 'Child / dog trailer', de: 'Kinder-/Hundeanhänger', it: 'Rimorchio bimbi/cani' } },
  { id: 'rack', perDay: { d1: 3, d2: 2, d4: 2, d7: 2, d14: 1 }, maxQty: 6, inBooking: false,
    label: { hr: 'Nosač prtljage', en: 'Luggage rack', de: 'Gepäckträger', it: 'Portapacchi' } },
  { id: 'pannier', perDay: { d1: 5, d2: 4, d4: 4, d7: 3, d14: 3 }, maxQty: 6, inBooking: false,
    label: { hr: 'Bisage', en: 'Panniers', de: 'Packtaschen', it: 'Borse laterali' } },
  { id: 'phone-holder', perDay: { d1: 2, d2: 2, d4: 1, d7: 1, d14: 1 }, maxQty: 6, inBooking: false,
    label: { hr: 'Držač telefona', en: 'Phone holder', de: 'Handyhalter', it: 'Porta telefono' } },
  { id: 'bottle-cage', perDay: { d1: 1, d2: 1, d4: 1, d7: 1, d14: 1 }, maxQty: 6, inBooking: false,
    label: { hr: 'Držač boce', en: 'Bottle cage', de: 'Flaschenhalter', it: 'Portaborraccia' } },
  { id: 'clip-pedals', perDay: { d1: 4, d2: 3, d4: 3, d7: 2, d14: 2 }, maxQty: 6, inBooking: false,
    label: { hr: 'Clip-in pedale (SPD, Look)', en: 'Clip-in pedals (SPD, Look)', de: 'Klickpedale (SPD, Look)', it: 'Pedali a sgancio (SPD, Look)' } },
  { id: 'bike-carrier', perDay: { d1: 12, d2: 10, d4: 9, d7: 8, d14: 7 }, maxQty: 1, inBooking: false,
    label: { hr: 'Nosač za auto (do 2 bicikla)', en: 'Car bike carrier (up to 2 bikes)', de: 'Fahrradträger fürs Auto (bis 2 Räder)', it: 'Portabici per auto (fino a 2 bici)' } },
  { id: 'bike-trailer', perDay: { d1: 45, d2: 40, d4: 36, d7: 32, d14: 28 }, maxQty: 1, inBooking: false,
    label: { hr: 'Prikolica za bicikle (do 16 kom)', en: 'Bike trailer (up to 16 bikes)', de: 'Fahrradanhänger (bis 16 Räder)', it: 'Rimorchio bici (fino a 16)' } },
];

/** DRAFT — dostava. Stari web kaže samo "prices on demand", ovo je prijedlog. */
export const DELIVERY_ZONES: Array<{ id: string; km: number; price: number; label: L10n }> = [
  { id: 'pickup', km: 0, price: 0,
    label: { hr: 'Preuzimanje u Šišanu', en: 'Pick-up in Šišan', de: 'Abholung in Šišan', it: 'Ritiro a Šišan' } },
  { id: 'medulin', km: 8, price: 12,
    label: { hr: 'Medulin, Premantura, Banjole', en: 'Medulin, Premantura, Banjole', de: 'Medulin, Premantura, Banjole', it: 'Medolino, Premantura, Banjole' } },
  { id: 'pula', km: 12, price: 15,
    label: { hr: 'Pula i okolica', en: 'Pula and around', de: 'Pula und Umgebung', it: 'Pola e dintorni' } },
  { id: 'istria', km: 60, price: 35,
    label: { hr: 'Ostatak Istre (do 60 km)', en: 'Rest of Istria (up to 60 km)', de: 'Übriges Istrien (bis 60 km)', it: 'Resto dell’Istria (fino a 60 km)' } },
];
