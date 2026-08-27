// Jedini izvor istine o tvrtki. Koristi ga i astro.config.mjs (zato .mjs)
// i sve schema.org komponente. Promjena telefona = promjena na jednom mjestu.

export const SITE_URL = 'https://rentabikepula.com';

export const LOCALES = /** @type {const} */ (['hr', 'en', 'de', 'it']);
export const DEFAULT_LOCALE = 'hr';

export const BUSINESS = {
  legalName: 'B.R.B. Sport d.o.o.',
  name: 'Rent a Bike Pula',
  street: 'Franje Mošnje 5',
  district: 'Šišan',
  postalCode: '52204',
  city: 'Ližnjan',
  region: 'Istarska županija',
  country: 'HR',
  countryName: 'Hrvatska',
  phone: '+385 98 372 458',
  phoneHref: '+38598372458',
  whatsapp: '38598372458',
  email: 'info.brbsport@gmail.com',
  contactPerson: 'Bruna',

  // TODO(klijent): potvrditi točne koordinate ulaza u servis.
  // Trenutno: centroid Šišana, dovoljno za Google Maps pin do potvrde.
  geo: { lat: 44.8331, lng: 13.9436 },

  // Ponedjeljak=1 … Nedjelja=7, prema starom webu.
  hours: [
    { days: [1, 2, 3, 4, 5], opens: '08:30', closes: '20:00' },
    { days: [6], opens: '09:00', closes: '14:00' },
  ],
  closedDays: [7],

  social: {
    facebook: 'https://www.facebook.com/brb.sport',
    tripadvisor:
      'https://www.tripadvisor.com/Attraction_Review-g1190777-d12064495-Reviews-B_R_B_Sport-Liznjan_Istria.html',
    parent: 'https://www.brbsport.hr',
  },

  // TODO(klijent): stvarni broj i prosjek recenzija s TripAdvisora.
  // Do potvrde se aggregateRating NE ispisuje u schemu (vidi JsonLd.astro).
  rating: null,

  currency: 'EUR',
};

/** Jezici s punim imenom za <html lang>, hreflang i prebacivač. */
export const LOCALE_META = {
  hr: { label: 'Hrvatski', short: 'HR', htmlLang: 'hr-HR', ogLocale: 'hr_HR' },
  en: { label: 'English', short: 'EN', htmlLang: 'en', ogLocale: 'en_GB' },
  de: { label: 'Deutsch', short: 'DE', htmlLang: 'de', ogLocale: 'de_DE' },
  it: { label: 'Italiano', short: 'IT', htmlLang: 'it', ogLocale: 'it_IT' },
};
