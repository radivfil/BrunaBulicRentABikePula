import { useEffect, useState } from 'preact/hooks';

/**
 * Filtri kataloga.
 *
 * Kartice su već otisnute na serveru i sve su u HTML-u — ovaj island ih
 * samo skriva i preslaguje. Posljedice su namjerne: Google vidi svih 20
 * bicikala bez izvršavanja JS-a, stranica radi i ako se skripta ne učita,
 * a filtriranje je trenutačno jer nema mrežnog zahtjeva.
 *
 * Preslagivanje ide preko CSS `order`, ne premještanjem čvorova — DOM
 * ostaje netaknut pa nema ni reflow bujice ni gubitka fokusa.
 */

export interface FilterLabels {
  filters: string; all: string; reset: string; sort: string;
  popular: string; priceAsc: string; priceDesc: string;
  results: string; empty: string; size: string; maxPrice: string;
  categories: Record<string, string>;
}

interface Props { labels: FilterLabels; categories: string[]; sizes: string[]; maxPrice: number }

type Sort = 'popular' | 'priceAsc' | 'priceDesc';

export default function CatalogFilters({ labels, categories, sizes, maxPrice }: Props) {
  const [cat, setCat] = useState<string>('all');
  const [size, setSize] = useState<string>('all');
  const [price, setPrice] = useState<number>(maxPrice);
  const [sort, setSort] = useState<Sort>('popular');
  const [count, setCount] = useState<number | null>(null);

  // Ulazna točka iz CategoryGrid-a na naslovnici: /bicikli/?kategorija=e-bike
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('kategorija');
    if (q && categories.includes(q)) setCat(q);
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('article[data-category]'));
    let visible = 0;

    for (const card of cards) {
      const cCat = card.dataset.category!;
      const cPrice = Number(card.dataset.price);
      const cSizes = (card.dataset.sizes ?? '').split(',');

      const ok =
        (cat === 'all' || cCat === cat) &&
        (size === 'all' || cSizes.includes(size)) &&
        cPrice <= price;

      card.parentElement!.hidden = !ok;
      if (ok) visible++;

      card.parentElement!.style.order =
        sort === 'popular' ? String(card.dataset.order)
        : sort === 'priceAsc' ? String(Math.round(cPrice))
        : String(1000 - Math.round(cPrice));
    }

    setCount(visible);

    // URL prati stanje: filtar se može podijeliti i vratiti se natrag na nj.
    const url = new URL(location.href);
    if (cat === 'all') url.searchParams.delete('kategorija');
    else url.searchParams.set('kategorija', cat);
    history.replaceState(null, '', url);
  }, [cat, size, price, sort]);

  const pill = (active: boolean) =>
    [
      'rounded-sm px-3.5 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-olive-700 text-limestone-50'
        : 'border border-limestone-200 bg-limestone-50 text-ink-soft hover:border-olive-300 hover:text-olive-700',
    ].join(' ');

  return (
    <div class="border-b border-limestone-200 bg-limestone-50/95 py-4 shadow-[0_8px_24px_-20px_rgb(26_28_23/0.5)] backdrop-blur-md">
      <div class="u-container flex flex-wrap items-center gap-x-3 gap-y-3">
        <div class="flex flex-wrap gap-2" role="group" aria-label={labels.filters}>
          <button type="button" class={pill(cat === 'all')} onClick={() => setCat('all')} aria-pressed={cat === 'all'}>
            {labels.all}
          </button>
          {categories.map((c) => (
            <button key={c} type="button" class={pill(cat === c)} onClick={() => setCat(c)} aria-pressed={cat === c}>
              {labels.categories[c]}
            </button>
          ))}
        </div>

        <div class="ml-auto flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-ink-muted">
            {labels.size}
            <select
              value={size}
              onChange={(e) => setSize((e.target as HTMLSelectElement).value)}
              class="rounded-xs border border-limestone-200 bg-limestone-50 px-2.5 py-1.5 text-sm text-ink"
            >
              <option value="all">{labels.all}</option>
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm text-ink-muted">
            {labels.maxPrice}
            <input
              type="range"
              min={5}
              max={maxPrice}
              step={1}
              value={price}
              onInput={(e) => setPrice(Number((e.target as HTMLInputElement).value))}
              class="accent-terracotta-600"
            />
            <span class="w-12 text-sm font-semibold text-ink">{price} €</span>
          </label>

          <label class="flex items-center gap-2 text-sm text-ink-muted">
            {labels.sort}
            <select
              value={sort}
              onChange={(e) => setSort((e.target as HTMLSelectElement).value as Sort)}
              class="rounded-xs border border-limestone-200 bg-limestone-50 px-2.5 py-1.5 text-sm text-ink"
            >
              <option value="popular">{labels.popular}</option>
              <option value="priceAsc">{labels.priceAsc}</option>
              <option value="priceDesc">{labels.priceDesc}</option>
            </select>
          </label>

          <p class="text-sm text-ink-muted" aria-live="polite">
            {count === null ? '' : count === 0 ? labels.empty : `${count} ${labels.results}`}
          </p>
        </div>
      </div>
    </div>
  );
}
