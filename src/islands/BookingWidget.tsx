import { useEffect, useMemo, useState } from 'preact/hooks';
import AvailabilityCalendar, { type CalendarLabels } from './AvailabilityCalendar';
import { createCheckout, getAvailability, bookingMode, type AvailabilityMap } from './lib/api';
import { lineTotal, ratePerDay, rentalDays, savingsPct, DEPOSIT_PCT, GROUP_DISCOUNT, type PriceTable } from '../data/pricing';

/**
 * Jedini `client:load` na stranici.
 *
 * Svi tekstovi stižu kao props iz Astra. To je namjerno: da island uvozi
 * i18n/ui.ts, u klijentski bundle bi otišao rječnik za sva četiri jezika
 * na svakoj stranici. Ovako gost dobije samo stringove svojeg jezika,
 * već otisnute u HTML-u.
 */

export interface BookingLabels extends CalendarLabels {
  title: string; dates: string; from: string; to: string; pickDates: string; pickEnd: string;
  qty: string; size: string; extras: string; delivery: string; summary: string;
  rental: string; total: string; deposit: string; rest: string;
  cta: string; ctaInquiry: string; processing: string;
  selectFirst: string; minDays: string; demoNotice: string; groupHint: string; error: string;
  day: string; days: string; perDay: string;
}

interface ExtraOption { id: string; label: string; perDay: PriceTable; maxQty: number }
interface DeliveryOption { id: string; label: string; price: number }

interface Props {
  bikeId: string;
  bikeName: string;
  sku: string;
  fleetSize: number;
  pricing: PriceTable;
  sizes: string[];
  extras: ExtraOption[];
  delivery: DeliveryOption[];
  summaryUrl: string;
  locale: string;
  labels: BookingLabels;
}

const HORIZON = 120; // koliko dana unaprijed dohvaćamo dostupnost
const eur = (n: number) => `${n.toFixed(n % 1 === 0 ? 0 : 2)} €`;

export default function BookingWidget(props: Props) {
  const { bikeId, fleetSize, pricing, sizes, extras, delivery, labels } = props;

  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(sizes[0] ?? 'one');
  const [extraQty, setExtraQty] = useState<Record<string, number>>({});
  const [deliveryId, setDeliveryId] = useState(delivery[0]?.id ?? 'pickup');
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [wide, setWide] = useState(false);

  const mode = bookingMode();

  // Dva mjeseca na desktopu, jedan na mobitelu. matchMedia umjesto CSS-a
  // jer se mijenja broj DOM čvorova, ne samo izgled.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = new Date().toISOString().slice(0, 10);
    getAvailability(bikeId, fleetSize, start, HORIZON)
      .then((map) => !cancelled && setAvailability(map))
      .catch(() => !cancelled && setAvailability({}));
    return () => { cancelled = true; };
  }, [bikeId, fleetSize]);

  function pick(day: string) {
    // Prvi klik postavlja početak; drugi klik zatvara raspon ako je
    // kasniji, inače postaje novi početak. Bez modova i bez uputa.
    if (!from || (from && to)) { setFrom(day); setTo(null); return; }
    if (day < from) { setFrom(day); return; }
    setTo(day);
  }

  const days = from && to ? rentalDays(from, to) : 0;
  const rate = days ? ratePerDay(pricing, days) : pricing.d1;
  const saved = days ? savingsPct(pricing, days) : 0;

  /** Najmanji broj slobodnih komada unutar odabranog raspona. */
  const minAvailable = useMemo(() => {
    if (!from || !to) return fleetSize;
    let min = fleetSize;
    const d = new Date(from + 'T00:00:00Z');
    const end = new Date(to + 'T00:00:00Z');
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      min = Math.min(min, availability[key] ?? fleetSize);
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return min;
  }, [from, to, availability, fleetSize]);

  const bikesTotal = days ? lineTotal(pricing, days, qty) : 0;
  const extrasTotal = days
    ? extras.reduce((sum, e) => sum + (extraQty[e.id] ? lineTotal(e.perDay, days, extraQty[e.id]!) : 0), 0)
    : 0;
  const deliveryTotal = delivery.find((d) => d.id === deliveryId)?.price ?? 0;
  const total = bikesTotal + extrasTotal + deliveryTotal;
  const deposit = Math.round(total * (DEPOSIT_PCT / 100));

  const canSubmit = !!from && !!to && days > 0 && qty <= minAvailable && !busy;

  async function submit() {
    if (!canSubmit || !from || !to) return;
    setBusy(true);
    setError(false);
    try {
      const { redirect } = await createCheckout({
        bikeId, bikeName: props.bikeName, sku: props.sku,
        from, to, days, qty, size,
        extras: Object.entries(extraQty).filter(([, n]) => n > 0).map(([id, n]) => ({ id, qty: n })),
        delivery: deliveryId,
        deliveryLabel: delivery.find((d) => d.id === deliveryId)?.label ?? deliveryId,
        total, deposit,
        locale: props.locale, url: props.summaryUrl,
      });
      window.location.assign(redirect);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div class="rounded-md border border-limestone-200 bg-limestone-100 p-5 shadow-panel sm:p-6">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="font-display text-xl font-semibold text-olive-900">{labels.title}</h2>
        <p class="text-right">
          <span class="font-display text-2xl font-semibold text-olive-900">{eur(rate)}</span>
          <span class="text-xs text-ink-muted">{labels.perDay}</span>
        </p>
      </div>

      {mode === 'demo' && (
        <p class="mt-3 rounded-xs border border-sand-500/40 bg-sand-500/10 px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {labels.demoNotice}
        </p>
      )}

      <fieldset class="mt-5">
        <legend class="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{labels.dates}</legend>
        <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
          <p class="rounded-xs border border-limestone-200 bg-limestone-50 px-3 py-2">
            <span class="block text-[0.6875rem] text-ink-muted">{labels.from}</span>
            <span class="font-medium">{from ?? '—'}</span>
          </p>
          <p class="rounded-xs border border-limestone-200 bg-limestone-50 px-3 py-2">
            <span class="block text-[0.6875rem] text-ink-muted">{labels.to}</span>
            <span class="font-medium">{to ?? '—'}</span>
          </p>
        </div>

        <div class="mt-2">
          <AvailabilityCalendar
            monthCursor={cursor}
            monthsShown={wide ? 2 : 1}
            from={from}
            to={to}
            availability={availability}
            qty={qty}
            fleetSize={fleetSize}
            labels={labels}
            onPick={pick}
            onCursor={(delta) => {
              const next = new Date(cursor);
              next.setUTCMonth(next.getUTCMonth() + delta);
              setCursor(next);
            }}
          />
        </div>

        <p class="mt-2 text-xs text-ink-muted" aria-live="polite">
          {!from ? labels.pickDates : !to ? labels.pickEnd : `${days} ${days === 1 ? labels.day : labels.days}${saved > 0 ? ` · −${saved}%` : ''}`}
        </p>
      </fieldset>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{labels.qty}</span>
          <div class="mt-2 flex items-center gap-1 rounded-xs border border-limestone-200 bg-limestone-50">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              class="px-3 py-2 text-lg leading-none text-ink-soft transition-colors hover:text-terracotta-600"
              aria-label="−"
            >−</button>
            <span class="flex-1 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(fleetSize, q + 1))}
              class="px-3 py-2 text-lg leading-none text-ink-soft transition-colors hover:text-terracotta-600"
              aria-label="+"
            >+</button>
          </div>
        </label>

        <label class="block">
          <span class="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{labels.size}</span>
          <select
            value={size}
            onChange={(e) => setSize((e.target as HTMLSelectElement).value)}
            class="mt-2 w-full rounded-xs border border-limestone-200 bg-limestone-50 px-3 py-2.5 text-sm"
          >
            {sizes.map((s) => <option key={s} value={s}>{s === 'one' ? '—' : s}</option>)}
          </select>
        </label>
      </div>

      {extras.length > 0 && (
        <fieldset class="mt-5">
          <legend class="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{labels.extras}</legend>
          <ul class="mt-2 space-y-1">
            {extras.map((e) => (
              <li key={e.id} class="flex items-center justify-between gap-3 rounded-xs bg-limestone-50 px-3 py-2">
                <span class="text-sm">
                  {e.label}
                  <span class="ml-2 text-xs text-ink-muted">{eur(ratePerDay(e.perDay, days || 1))}{labels.perDay}</span>
                </span>
                <span class="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraQty((s) => ({ ...s, [e.id]: Math.max(0, (s[e.id] ?? 0) - 1) }))}
                    class="px-2 text-ink-soft transition-colors hover:text-terracotta-600"
                    aria-label={`− ${e.label}`}
                  >−</button>
                  <span class="w-4 text-center text-sm font-semibold">{extraQty[e.id] ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => setExtraQty((s) => ({ ...s, [e.id]: Math.min(e.maxQty, (s[e.id] ?? 0) + 1) }))}
                    class="px-2 text-ink-soft transition-colors hover:text-terracotta-600"
                    aria-label={`+ ${e.label}`}
                  >+</button>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <label class="mt-5 block">
        <span class="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{labels.delivery}</span>
        <select
          value={deliveryId}
          onChange={(e) => setDeliveryId((e.target as HTMLSelectElement).value)}
          class="mt-2 w-full rounded-xs border border-limestone-200 bg-limestone-50 px-3 py-2.5 text-sm"
        >
          {delivery.map((d) => (
            <option key={d.id} value={d.id}>{d.label}{d.price > 0 ? ` · ${eur(d.price)}` : ''}</option>
          ))}
        </select>
      </label>

      <div class="mt-6 border-t border-limestone-200 pt-4">
        {days === 0 ? (
          <p class="text-sm text-ink-muted">{labels.selectFirst}</p>
        ) : (
          <dl class="space-y-1.5 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-ink-soft">{labels.rental} · {qty} × {days} {days === 1 ? labels.day : labels.days}</dt>
              <dd class="font-medium">{eur(bikesTotal)}</dd>
            </div>
            {extrasTotal > 0 && (
              <div class="flex justify-between gap-4">
                <dt class="text-ink-soft">{labels.extras}</dt>
                <dd class="font-medium">{eur(extrasTotal)}</dd>
              </div>
            )}
            {deliveryTotal > 0 && (
              <div class="flex justify-between gap-4">
                <dt class="text-ink-soft">{labels.delivery}</dt>
                <dd class="font-medium">{eur(deliveryTotal)}</dd>
              </div>
            )}
            <div class="flex justify-between gap-4 border-t border-limestone-200 pt-2 font-display text-lg font-semibold text-olive-900">
              <dt>{labels.total}</dt>
              <dd>{eur(total)}</dd>
            </div>
            <div class="flex justify-between gap-4 text-xs text-ink-muted">
              <dt>{labels.deposit} ({DEPOSIT_PCT} %)</dt>
              <dd>{eur(deposit)}</dd>
            </div>
            <div class="flex justify-between gap-4 text-xs text-ink-muted">
              <dt>{labels.rest}</dt>
              <dd>{eur(total - deposit)}</dd>
            </div>
          </dl>
        )}

        {from && to && qty > minAvailable && (
          <p class="mt-3 rounded-xs bg-terracotta-100 px-3 py-2 text-xs text-terracotta-700">
            {labels.minDays}
          </p>
        )}
        {qty >= GROUP_DISCOUNT.minBikes && (
          <p class="mt-3 text-xs text-ink-muted">{labels.groupHint}</p>
        )}
        {error && (
          <p class="mt-3 rounded-xs bg-terracotta-100 px-3 py-2 text-xs text-terracotta-700" role="alert">
            {labels.error}
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          class="mt-4 w-full rounded-sm bg-terracotta-600 px-5 py-3.5 text-sm font-semibold text-limestone-50 transition-[background-color,transform] duration-200 hover:bg-terracotta-700 disabled:cursor-not-allowed disabled:bg-limestone-300 disabled:text-limestone-50"
        >
          {busy ? labels.processing : mode === 'live' ? labels.cta : labels.ctaInquiry}
        </button>
      </div>
    </div>
  );
}
