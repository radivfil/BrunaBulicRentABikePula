/**
 * JEDINA točka dodira između UI-ja i backenda.
 *
 * Widget nikad ne zna gdje podaci dolaze. Danas je to demo adapter koji
 * generira dostupnost lokalno; sutra se upali `php` adapter i priključe
 * Stripe ključevi; kasnije, kad se doda prava baza, mijenja se samo ova
 * datoteka. Nijedna komponenta ne mora znati da se išta promijenilo.
 */

export type AvailabilityMap = Record<string, number>;

export interface QuoteLine { label: string; amount: number }

export interface BookingRequest {
  bikeId: string;
  bikeName: string;
  sku: string;
  from: string;
  to: string;
  days: number;
  qty: number;
  size: string;
  extras: Array<{ id: string; qty: number }>;
  delivery: string;
  /** Ljudski čitljiv naziv zone — za sažetak; PHP-u ide `delivery` id. */
  deliveryLabel: string;
  total: number;
  deposit: number;
  locale: string;
  url: string;
}

export type Mode = 'demo' | 'live';

/**
 * Način rada dolazi iz data atributa koji Astro ispisuje u HTML, pa se
 * prebacuje bez rebuilda islanda. Bez konfiguriranog end-pointa =
 * automatski demo, tako da stranica nikad ne pukne pred klijentom.
 */
function config() {
  const el = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-booking-config]') : null;
  const endpoint = el?.dataset.bookingEndpoint || '';
  const mode: Mode = el?.dataset.bookingMode === 'live' && endpoint ? 'live' : 'demo';
  return { mode, endpoint };
}

export const bookingMode = (): Mode => config().mode;

/** Deterministički pseudo-slučajan broj iz stringa — isti ulaz, isti izlaz. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Dostupnost po danima za zadani raspon.
 *
 * DEMO: izvodi se iz hasha (bikeId + datum) pa je stabilna između
 * osvježavanja stranice — klijent na demu vidi uvjerljiv, a ne treperav
 * kalendar. Kolovoz je namjerno popunjeniji, kao u stvarnosti.
 */
export async function getAvailability(
  bikeId: string,
  fleetSize: number,
  fromISO: string,
  days: number
): Promise<AvailabilityMap> {
  const { mode, endpoint } = config();

  if (mode === 'live') {
    const res = await fetch(`${endpoint}?action=availability&bike=${encodeURIComponent(bikeId)}&from=${fromISO}&days=${days}`);
    if (!res.ok) throw new Error(`availability ${res.status}`);
    return (await res.json()) as AvailabilityMap;
  }

  const out: AvailabilityMap = {};
  const start = new Date(fromISO + 'T00:00:00Z');
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const month = d.getUTCMonth();
    const highSeason = month === 6 || month === 7; // srpanj i kolovoz
    const pressure = highSeason ? 0.78 : month === 5 || month === 8 ? 0.45 : 0.2;
    const booked = Math.round(fleetSize * pressure * hash(bikeId + iso));
    out[iso] = Math.max(0, fleetSize - booked);
  }
  return out;
}

/**
 * Šalje rezervaciju. U live načinu PHP end-point vraća Stripe Checkout URL
 * na koji preusmjeravamo; u demo načinu vraćamo lokalnu stranicu sažetka
 * pa je cijeli tijek klikabilan bez ijednog ključa.
 */
export async function createCheckout(req: BookingRequest): Promise<{ redirect: string }> {
  const { mode, endpoint } = config();

  if (mode === 'live') {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkout', ...req }),
    });
    if (!res.ok) throw new Error(`checkout ${res.status}`);
    const data = (await res.json()) as { url?: string; error?: string };
    if (!data.url) throw new Error(data.error || 'no checkout url');
    return { redirect: data.url };
  }

  const q = new URLSearchParams({
    // Gostu se prikazuje ime modela i naziv zone; interni id ide samo
    // serveru. Sažetak nikad ne smije pokazati "apache-hupahu".
    bike: req.bikeName,
    from: req.from,
    to: req.to,
    qty: String(req.qty),
    size: req.size,
    delivery: req.deliveryLabel,
    extras: req.extras.map((e) => `${e.id}:${e.qty}`).join(','),
    total: req.total.toFixed(2),
    deposit: req.deposit.toFixed(2),
    demo: '1',
  });
  return { redirect: `${req.url}?${q}` };
}
