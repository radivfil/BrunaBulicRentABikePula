import { BUSINESS, SITE_URL } from '../data/site.mjs';
import type { Locale } from '../i18n/routes';

const abs = (p: string) => new URL(p, SITE_URL).href;

/**
 * LocalBusiness — ide na SVAKU stranicu preko @graph-a, s fiksnim @id-om
 * da Google shvati da je riječ o jednom te istom poslovnom subjektu, a ne
 * o dvadeset različitih. Ovo je najvažniji pojedinačni SEO element za
 * lokalni upit tipa "najam bicikala pula".
 */
export function localBusiness() {
  const dayMap = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return {
    '@type': ['LocalBusiness', 'SportingGoodsStore'],
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    // Nema službenog schema.org tipa za najam bicikala; DBpedia pojam je
    // standardan način da se to ipak jednoznačno kaže.
    additionalType: 'https://www.productontology.org/id/Bicycle_rental',
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    image: abs('/og-default.jpg'),
    priceRange: '€€',
    currenciesAccepted: BUSINESS.currency,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${BUSINESS.street}, ${BUSINESS.district}`,
      addressLocality: BUSINESS.city,
      postalCode: BUSINESS.postalCode,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng },
    openingHoursSpecification: BUSINESS.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.map((d) => dayMap[d]),
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: ['Pula', 'Medulin', 'Ližnjan', 'Premantura', 'Banjole', 'Istarska županija'].map(
      (n) => ({ '@type': 'Place', name: n })
    ),
    sameAs: [BUSINESS.social.facebook, BUSINESS.social.tripadvisor, BUSINESS.social.parent],
    // aggregateRating se NAMJERNO izostavlja dok klijent ne potvrdi brojke
    // s TripAdvisora. Izmišljena ocjena je razlog za ručnu kaznu.
    ...(BUSINESS.rating ? { aggregateRating: BUSINESS.rating } : {}),
  };
}

/** Product + Offer za pojedini bicikl. `lowPrice` je najniža dnevna tarifa. */
export function bikeProduct(opts: {
  name: string;
  description: string;
  sku: string;
  brand: string;
  image: string;
  url: string;
  lowPrice: number;
  highPrice: number;
  locale: Locale;
}) {
  return {
    '@type': 'Product',
    '@id': `${opts.url}#product`,
    name: opts.name,
    description: opts.description,
    sku: opts.sku,
    brand: { '@type': 'Brand', name: opts.brand },
    image: abs(opts.image),
    category: 'Bicycle rental',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: BUSINESS.currency,
      lowPrice: opts.lowPrice,
      highPrice: opts.highPrice,
      offerCount: 5,
      availability: 'https://schema.org/InStock',
      // Najam je usluga po danu — bez ovoga Google prikazuje dnevnu tarifu
      // kao prodajnu cijenu bicikla.
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: opts.lowPrice,
        priceCurrency: BUSINESS.currency,
        unitCode: 'DAY',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' },
      },
      seller: { '@id': `${SITE_URL}/#business` },
    },
  };
}

export function tourTrip(opts: {
  name: string;
  description: string;
  url: string;
  price: number;
  image: string;
  distanceKm: number;
}) {
  return {
    '@type': 'TouristTrip',
    '@id': `${opts.url}#trip`,
    name: opts.name,
    description: opts.description,
    image: abs(opts.image),
    provider: { '@id': `${SITE_URL}/#business` },
    offers: {
      '@type': 'Offer',
      price: opts.price,
      priceCurrency: BUSINESS.currency,
      availability: 'https://schema.org/InStock',
    },
    itinerary: { '@type': 'ItemList', numberOfItems: 1 },
  };
}

export function breadcrumbs(items: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
}
