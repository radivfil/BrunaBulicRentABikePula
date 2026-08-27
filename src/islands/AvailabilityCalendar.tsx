import { useMemo } from 'preact/hooks';
import type { AvailabilityMap } from './lib/api';

/**
 * Kalendar raspona datuma pisan od nule (~3 kB).
 *
 * Zašto ne react-day-picker ili slično: najmanja gotova biblioteka ovdje
 * košta 25–40 kB JS-a, a treba nam mreža gumba s dva stanja. Na stranici
 * čiji je cilj Lighthouse 95+ to je 40 kB koje plaća svaki posjetitelj
 * mobitelom na 4G vezi u kolovozu.
 */

export interface CalendarLabels {
  weekdays: string[];
  months: string[];
  prev: string;
  next: string;
  available: string;
  left: string;
  closed: string;
}

interface Props {
  monthCursor: Date;
  monthsShown: number;
  from: string | null;
  to: string | null;
  availability: AvailabilityMap;
  qty: number;
  fleetSize: number;
  labels: CalendarLabels;
  onPick: (iso: string) => void;
  onCursor: (delta: number) => void;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayISO = () => iso(new Date());

/** Ponedjeljak = 0, radi hrvatskog/europskog rasporeda tjedna. */
function mondayIndex(date: Date) {
  return (date.getUTCDay() + 6) % 7;
}

function monthMatrix(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const pad = mondayIndex(first);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (Date | null)[] = Array(pad).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function AvailabilityCalendar({
  monthCursor, monthsShown, from, to, availability, qty, fleetSize, labels, onPick, onCursor,
}: Props) {
  const today = todayISO();

  const months = useMemo(
    () =>
      Array.from({ length: monthsShown }, (_, i) => {
        const y = monthCursor.getUTCFullYear();
        const m = monthCursor.getUTCMonth() + i;
        return { year: y + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
      }),
    [monthCursor, monthsShown]
  );

  return (
    <div class="rounded-sm border border-limestone-200 bg-limestone-50 p-3">
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onCursor(-1)}
          aria-label={labels.prev}
          class="rounded-xs p-2 text-ink-soft transition-colors hover:bg-limestone-100 hover:text-terracotta-600"
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M10 3 5 8l5 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <p class="font-display text-sm font-semibold text-olive-900" aria-live="polite">
          {months.map((m) => `${labels.months[m.month]} ${m.year}`).join(' — ')}
        </p>
        <button
          type="button"
          onClick={() => onCursor(1)}
          aria-label={labels.next}
          class="rounded-xs p-2 text-ink-soft transition-colors hover:bg-limestone-100 hover:text-terracotta-600"
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m6 3 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class={monthsShown > 1 ? 'grid gap-4 sm:grid-cols-2' : ''}>
        {months.map(({ year, month }) => (
          <table key={`${year}-${month}`} class="w-full border-collapse" role="grid">
            <caption class="sr-only">{`${labels.months[month]} ${year}`}</caption>
            <thead>
              <tr>
                {labels.weekdays.map((w) => (
                  <th key={w} scope="col" class="pb-1 text-center text-[0.625rem] font-semibold tracking-wide text-ink-muted uppercase">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chunk(monthMatrix(year, month), 7).map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => {
                    if (!day) return <td key={di} />;

                    const key = iso(day);
                    const isPast = key < today;
                    // Nedjeljom se ne preuzima ni ne vraća — poslovnica je
                    // zatvorena, pa ti dani ne smiju biti odabirivi rubovi.
                    const isSunday = day.getUTCDay() === 0;
                    const left = availability[key] ?? fleetSize;
                    const isFull = left < qty;
                    const disabled = isPast || isSunday || isFull;

                    const isStart = key === from;
                    const isEnd = key === to;
                    const inRange = !!from && !!to && key > from && key < to;

                    return (
                      <td key={di} class="p-0">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onPick(key)}
                          aria-label={
                            disabled
                              ? `${day.getUTCDate()}. ${labels.months[month]} — ${isSunday ? labels.closed : labels.available}: 0`
                              : `${day.getUTCDate()}. ${labels.months[month]} — ${left} ${labels.left}`
                          }
                          aria-pressed={isStart || isEnd}
                          class={[
                            'relative flex aspect-square w-full items-center justify-center text-sm transition-colors',
                            'disabled:cursor-not-allowed disabled:text-limestone-300',
                            isStart || isEnd
                              ? 'z-10 rounded-xs bg-terracotta-600 font-semibold text-limestone-50'
                              : inRange
                                ? 'bg-terracotta-100 text-terracotta-700'
                                : !disabled && 'text-ink hover:bg-olive-100',
                            isFull && !isPast && !isSunday && 'line-through',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {day.getUTCDate()}
                          {/* Točkica = zadnja dva komada. Diskretan signal
                              hitnosti bez ijedne riječi teksta. */}
                          {!disabled && left <= 2 && !isStart && !isEnd && (
                            <span class="absolute bottom-1 h-1 w-1 rounded-full bg-terracotta-400" aria-hidden="true" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
