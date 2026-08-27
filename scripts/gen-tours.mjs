import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

// ⚠ Ture ne postoje na starom webu. Cijeli sadržaj je PRIJEDLOG i označen
// je isDraft: true, pa se na stranici prikazuje s upozorenjem.
const tours = [
  {
    slug: 'kamenjak-poludnevna', order: 1, distanceKm: 28, ascentM: 260, durationH: 4,
    difficulty: 'easy', minPeople: 2, pricePerPerson: 45, bikeCategory: 'mtb',
    startPoint: 'Šišan, Franje Mošnje 5', image: 'mtb-banner.jpg',
    alt: {
      hr: 'Brdski bicikl B.R.B. na makadamskom putu iznad mora, u pozadini drugi biciklist',
      en: 'A B.R.B. mountain bike on a gravel track above the sea, another rider in the distance',
      de: 'Ein B.R.B.-Mountainbike auf einem Schotterweg über dem Meer, dahinter ein weiterer Radfahrer',
      it: 'Una mountain bike B.R.B. su uno sterrato sopra il mare, in fondo un altro ciclista',
    },
    i18n: {
      hr: { name: 'Kamenjak — poludnevna', tagline: 'Rt Kamenjak i uvale Premanture',
        description: 'Makadamom kroz park prirode Kamenjak do najjužnije točke Istre. Ravno je, tvrdo i široko — vozivo za svakoga tko sjedne na bicikl. Stajemo na Safari baru i na uvali gdje je more najbistrije oko podneva.',
        highlights: ['Najjužnija točka Istre', 'Kupanje u uvali', 'Bez tehnički zahtjevnih dijelova'],
        includes: ['Vodič', 'Bicikl i kaciga', 'Voda i voće', 'Prijevoz do polazišta'] },
      en: { name: 'Kamenjak — half day', tagline: 'Cape Kamenjak and the coves of Premantura',
        description: 'Gravel tracks through the Kamenjak nature park to the southernmost point of Istria. Flat, firm and wide — rideable by anyone who can sit on a bike. We stop at the Safari bar and at the cove where the water is clearest around noon.',
        highlights: ['Southernmost point of Istria', 'Swim stop in a cove', 'No technical sections'],
        includes: ['Guide', 'Bike and helmet', 'Water and fruit', 'Transfer to the start'] },
      de: { name: 'Kamenjak — halbtags', tagline: 'Kap Kamenjak und die Buchten von Premantura',
        description: 'Auf Schotterwegen durch den Naturpark Kamenjak zum südlichsten Punkt Istriens. Flach, fest und breit — fahrbar für jeden, der auf einem Rad sitzen kann. Wir halten an der Safari-Bar und an der Bucht, in der das Wasser gegen Mittag am klarsten ist.',
        highlights: ['Südlichster Punkt Istriens', 'Badestopp in einer Bucht', 'Keine technischen Passagen'],
        includes: ['Guide', 'Rad und Helm', 'Wasser und Obst', 'Transfer zum Start'] },
      it: { name: 'Kamenjak — mezza giornata', tagline: 'Capo Kamenjak e le cale di Premantura',
        description: 'Sterrati nel parco naturale del Kamenjak fino al punto più meridionale dell’Istria. Piano, compatto e largo: percorribile da chiunque sappia stare in sella. Sosta al Safari bar e alla cala dove l’acqua è più limpida verso mezzogiorno.',
        highlights: ['Punto più a sud dell’Istria', 'Sosta bagno in una cala', 'Nessun tratto tecnico'],
        includes: ['Guida', 'Bici e casco', 'Acqua e frutta', 'Transfer fino alla partenza'] },
    },
  },
  {
    slug: 'istarsko-zalede-konoba', order: 2, distanceKm: 52, ascentM: 720, durationH: 7,
    difficulty: 'moderate', minPeople: 4, pricePerPerson: 85, bikeCategory: 'e-bike',
    startPoint: 'Šišan, Franje Mošnje 5', image: 'banner-about.jpg',
    alt: {
      hr: 'Brdski bicikl u visokoj travi iznad mora, pogled prema Kvarneru',
      en: 'A mountain bike in tall grass above the sea, looking out towards Kvarner',
      de: 'Ein Mountainbike im hohen Gras über dem Meer mit Blick Richtung Kvarner',
      it: 'Una mountain bike nell’erba alta sopra il mare, vista verso il Quarnero',
    },
    i18n: {
      hr: { name: 'Zaleđe i konoba', tagline: 'Cjelodnevna e-bike tura u unutrašnjost',
        description: 'Električnim biciklima od mora prema unutrašnjosti — kroz Šišan, Ližnjan i makadame prema Barbanu. Uspona ima, ali s motorom ih nećete pamtiti. Središnji dio dana je ručak u obiteljskoj konobi, s domaćim tjesteninom i uljem iz vlastitog maslinika.',
        highlights: ['Cjelodnevni izlet s ručkom', 'E-bike briše uspone', 'Krajolik koji turisti ne vide'],
        includes: ['Vodič', 'E-bike i kaciga', 'Ručak u konobi', 'Voda i međuobrok'] },
      en: { name: 'Inland and konoba', tagline: 'Full-day e-bike tour into the hinterland',
        description: 'On e-bikes from the sea towards inland Istria — through Šišan, Ližnjan and gravel roads towards Barban. There is climbing, but with a motor you will not remember it. The middle of the day is lunch at a family konoba, with home-made pasta and oil from their own olive grove.',
        highlights: ['Full day out with lunch', 'The motor flattens the climbs', 'Landscape most visitors never see'],
        includes: ['Guide', 'E-bike and helmet', 'Lunch at the konoba', 'Water and a snack'] },
      de: { name: 'Hinterland und Konoba', tagline: 'Ganztägige E-Bike-Tour ins Landesinnere',
        description: 'Mit E-Bikes vom Meer ins istrische Hinterland — durch Šišan, Ližnjan und über Schotterstraßen Richtung Barban. Höhenmeter gibt es, mit Motor merkt man sie kaum. Mittelpunkt des Tages ist das Mittagessen in einer Familien-Konoba, mit hausgemachter Pasta und Öl aus dem eigenen Olivenhain.',
        highlights: ['Ganzer Tag mit Mittagessen', 'Der Motor ebnet die Anstiege', 'Landschaft, die Gäste sonst nie sehen'],
        includes: ['Guide', 'E-Bike und Helm', 'Mittagessen in der Konoba', 'Wasser und Snack'] },
      it: { name: 'Entroterra e konoba', tagline: 'Tour e-bike di un giorno nell’entroterra',
        description: 'In e-bike dal mare verso l’interno — attraverso Šišan, Ližnjan e sterrati in direzione Barbana. Le salite ci sono, ma col motore non le ricorderete. Il centro della giornata è il pranzo in una konoba familiare, con pasta fatta in casa e olio del loro uliveto.',
        highlights: ['Giornata intera con pranzo', 'Il motore spiana le salite', 'Paesaggi che i turisti non vedono'],
        includes: ['Guida', 'E-bike e casco', 'Pranzo in konoba', 'Acqua e spuntino'] },
    },
  },
  {
    slug: 'pula-arena-obala', order: 3, distanceKm: 18, ascentM: 90, durationH: 3,
    difficulty: 'easy', minPeople: 2, pricePerPerson: 35, bikeCategory: 'city',
    startPoint: 'Pula, po dogovoru', image: 'banner2.jpg',
    alt: {
      hr: 'Bijeli brdski bicikl u suhoj travi iznad mora, u pozadini svjetionik',
      en: 'A white mountain bike in dry grass above the sea, a lighthouse behind',
      de: 'Ein weißes Mountainbike im trockenen Gras über dem Meer, dahinter ein Leuchtturm',
      it: 'Una mountain bike bianca nell’erba secca sopra il mare, sullo sfondo un faro',
    },
    i18n: {
      hr: { name: 'Pula uz obalu', tagline: 'Lagana gradska tura, tri sata',
        description: 'Gradskim biciklima od Arene uz obalu prema Verudeli i Zlatnim stijenama. Sve je ravno i asfaltirano, bez ijednog ozbiljnog uspona — tura za obitelji, prvi dan odmora ili one koji jednostavno žele vidjeti grad bez auta.',
        highlights: ['Ravno i asfaltirano', 'Prikladno za djecu', 'Arena, Verudela, Zlatne stijene'],
        includes: ['Vodič', 'Gradski bicikl i kaciga', 'Voda'] },
      en: { name: 'Pula along the coast', tagline: 'Easy city tour, three hours',
        description: 'On city bikes from the Arena along the coast towards Verudela and the Golden Rocks. All flat and paved, without a single serious climb — a tour for families, for the first day of a holiday, or for anyone who simply wants to see the city without a car.',
        highlights: ['Flat and paved throughout', 'Suitable for children', 'Arena, Verudela, Golden Rocks'],
        includes: ['Guide', 'City bike and helmet', 'Water'] },
      de: { name: 'Pula an der Küste', tagline: 'Leichte Stadttour, drei Stunden',
        description: 'Mit Citybikes von der Arena an der Küste entlang Richtung Verudela und Goldene Felsen. Alles flach und asphaltiert, ohne einen einzigen ernsthaften Anstieg — eine Tour für Familien, für den ersten Urlaubstag oder für alle, die die Stadt einfach ohne Auto sehen wollen.',
        highlights: ['Durchgehend flach und asphaltiert', 'Für Kinder geeignet', 'Arena, Verudela, Goldene Felsen'],
        includes: ['Guide', 'Citybike und Helm', 'Wasser'] },
      it: { name: 'Pola lungo la costa', tagline: 'Tour cittadino facile, tre ore',
        description: 'In city bike dall’Arena lungo la costa verso Verudela e gli Scogli d’Oro. Tutto piano e asfaltato, senza una sola salita seria: un tour per famiglie, per il primo giorno di vacanza o per chi vuole semplicemente vedere la città senza auto.',
        highlights: ['Tutto piano e asfaltato', 'Adatto ai bambini', 'Arena, Verudela, Scogli d’Oro'],
        includes: ['Guida', 'City bike e casco', 'Acqua'] },
    },
  },
];

const y = (v, indent = 0) => {
  const pad = ' '.repeat(indent);
  if (Array.isArray(v)) return '\n' + v.map((x) => `${pad}  - ${JSON.stringify(x)}`).join('\n');
  if (typeof v === 'object' && v !== null) {
    return '\n' + Object.entries(v)
      .map(([k, val]) => `${pad}  ${k}:${typeof val === 'object' ? y(val, indent + 2) : ' ' + JSON.stringify(val)}`)
      .join('\n');
  }
  return ' ' + JSON.stringify(v);
};

for (const t of tours) {
  const fm = [
    '---',
    `order: ${t.order}`,
    `distanceKm: ${t.distanceKm}`,
    `ascentM: ${t.ascentM}`,
    `durationH: ${t.durationH}`,
    `difficulty: ${JSON.stringify(t.difficulty)}`,
    `minPeople: ${t.minPeople}`,
    `pricePerPerson: ${t.pricePerPerson}`,
    `bikeCategory: ${JSON.stringify(t.bikeCategory)}`,
    `startPoint: ${JSON.stringify(t.startPoint)}`,
    `image: ${JSON.stringify('../../assets/site/' + t.image)}`,
    `imageAlt:${y(t.alt)}`,
    `i18n:${y(t.i18n)}`,
    'isDraft: true',
    '---',
    '',
  ].join('\n');
  writeFileSync(join(OUT, `${t.slug}.md`), fm, 'utf8');
}
console.log(`Zapisano ${tours.length} tura u ${OUT}`);
