<?php
/**
 * Rent a Bike Pula — Stripe Checkout end-point.
 *
 * Jedina dinamična komponenta cijele stranice. Sve ostalo je statični
 * HTML; ovo živi na istom shared hostingu koji već vrti PHP (stara
 * stranica je bila .php), pa ne treba ni Node ni novi server.
 *
 * NAČELA
 *  1. Iznos s klijenta se NIKAD ne naplaćuje. Cijena se ponovno računa
 *     ovdje, iz api/data.json koji generira build. Ako se ne poklopi s
 *     onim što je poslao preglednik, zahtjev se odbija.
 *  2. Bez composera i bez Stripe SDK-a — jedan cURL poziv na REST API.
 *     Na shared hostingu je manje ovisnosti uvijek bolje.
 *  3. Tajni ključ nije u repozitoriju. Stavlja se u api/config.php koji
 *     se kopira ručno na server (vidi config.sample.php).
 *
 * UKLJUČIVANJE: u BikeDetail.astro promijeniti
 *     data-booking-mode="demo"  ->  "live"
 *     data-booking-endpoint=""  ->  "/api/checkout.php"
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$configPath = __DIR__ . '/config.php';
$config = is_readable($configPath) ? require $configPath : [];

$secretKey  = $config['stripe_secret_key'] ?? '';
$siteUrl    = rtrim($config['site_url'] ?? 'https://rentabikepula.com', '/');
$allowOrigin = parse_url($siteUrl, PHP_URL_HOST);

function fail(int $code, string $message): never {
    http_response_code($code);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Cjenik koji je generirao build. Bez njega se ne naplaćuje ništa. */
$dataPath = __DIR__ . '/data.json';
if (!is_readable($dataPath)) {
    fail(500, 'Price data missing. Run the build and upload api/data.json.');
}
$data = json_decode((string) file_get_contents($dataPath), true, 512, JSON_THROW_ON_ERROR);

/* ── Dostupnost ─────────────────────────────────────────────────────────
 * Prijelazno rješenje: flota minus rezervacije zapisane u bookings.json.
 * Kad se doda prava baza (SQLite je na ovom hostingu dovoljan), mijenja
 * se samo ova funkcija — ugovor prema pregledniku ostaje isti.
 */
function availabilityFor(array $data, string $bikeId, string $fromISO, int $days): array {
    $fleet = (int) ($data['bikes'][$bikeId]['fleetSize'] ?? 0);
    $bookingsPath = __DIR__ . '/bookings.json';
    $booked = is_readable($bookingsPath)
        ? json_decode((string) file_get_contents($bookingsPath), true) ?: []
        : [];

    $out = [];
    $cursor = new DateTimeImmutable($fromISO, new DateTimeZone('UTC'));
    for ($i = 0; $i < $days; $i++) {
        $key = $cursor->format('Y-m-d');
        $taken = (int) ($booked[$bikeId][$key] ?? 0);
        $out[$key] = max(0, $fleet - $taken);
        $cursor = $cursor->modify('+1 day');
    }
    return $out;
}

/** Cijena po danu za odgovarajući tarifni razred. */
function ratePerDay(array $table, array $tiers, int $days): float {
    $rate = (float) $table['d1'];
    foreach ($tiers as $tier) {
        if ($days >= $tier['minDays']) {
            $rate = (float) $table[$tier['key']];
        }
    }
    return $rate;
}

/* ── GET: dostupnost ───────────────────────────────────────────────── */
if (($_GET['action'] ?? '') === 'availability') {
    $bike = (string) ($_GET['bike'] ?? '');
    $from = (string) ($_GET['from'] ?? '');
    $days = min(365, max(1, (int) ($_GET['days'] ?? 120)));

    if (!isset($data['bikes'][$bike]) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
        fail(400, 'Bad request');
    }

    header('Cache-Control: public, max-age=60');
    echo json_encode(availabilityFor($data, $bike, $from, $days));
    exit;
}

/* ── POST: Checkout ────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method not allowed');
}

// Zahtjev mora doći s naše stranice. Nije zamjena za autentikaciju, ali
// odbija najjednostavnije zloupotrebe end-pointa s tuđih domena.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $allowOrigin) {
    fail(403, 'Forbidden');
}

$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body)) {
    fail(400, 'Invalid JSON');
}

$bikeId = (string) ($body['bikeId'] ?? '');
$from   = (string) ($body['from'] ?? '');
$to     = (string) ($body['to'] ?? '');
$qty    = (int) ($body['qty'] ?? 0);
$size   = substr((string) ($body['size'] ?? ''), 0, 8);
$locale = in_array($body['locale'] ?? '', ['hr', 'en', 'de', 'it'], true) ? $body['locale'] : 'hr';

$bike = $data['bikes'][$bikeId] ?? null;
if ($bike === null) {
    fail(400, 'Unknown bike');
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
    fail(400, 'Bad dates');
}

$start = new DateTimeImmutable($from, new DateTimeZone('UTC'));
$end   = new DateTimeImmutable($to, new DateTimeZone('UTC'));
$today = new DateTimeImmutable('today', new DateTimeZone('UTC'));

if ($start < $today)          fail(400, 'Start date is in the past');
if ($end < $start)            fail(400, 'End before start');
$days = (int) $start->diff($end)->days + 1;
if ($days > 60)               fail(400, 'Rental too long');
if ($qty < 1 || $qty > $bike['fleetSize']) fail(400, 'Bad quantity');

// Ponovna provjera dostupnosti na serveru: preglednik je mogao stajati
// otvoren sat vremena i u međuvremenu je netko drugi rezervirao.
$avail = availabilityFor($data, $bikeId, $from, $days);
foreach ($avail as $left) {
    if ($left < $qty) fail(409, 'Not available for these dates');
}

/* ── Izračun cijene (izvor istine) ─────────────────────────────────── */
$tiers = $data['tiers'];
$total = ratePerDay($bike['pricing'], $tiers, $days) * $days * $qty;

$extrasIn = is_array($body['extras'] ?? null) ? $body['extras'] : [];
$extraLines = [];
foreach ($extrasIn as $item) {
    $id  = (string) ($item['id'] ?? '');
    $num = max(0, min(20, (int) ($item['qty'] ?? 0)));
    if ($num === 0) continue;

    foreach ($data['extras'] as $extra) {
        if ($extra['id'] === $id) {
            $line = ratePerDay($extra['perDay'], $tiers, $days) * $days * $num;
            $total += $line;
            $extraLines[] = ['id' => $id, 'qty' => $num, 'amount' => $line];
            break;
        }
    }
}

$deliveryId = (string) ($body['delivery'] ?? 'pickup');
foreach ($data['delivery'] as $zone) {
    if ($zone['id'] === $deliveryId) {
        $total += (float) $zone['price'];
        break;
    }
}

// Klijentov iznos smije odstupati najviše za zaokruživanje. Veće
// odstupanje znači ili neuspjeli deploy ili pokušaj podvale — oboje
// zaslužuju odbijanje, a ne tihu naplatu krive brojke.
$clientTotal = (float) ($body['total'] ?? 0);
if (abs($clientTotal - $total) > 0.5) {
    fail(409, 'Price changed, please reload');
}

$deposit = round($total * ((int) $data['depositPct'] / 100), 2);
$amountCents = (int) round($deposit * 100);
if ($amountCents < 200) {
    fail(400, 'Amount too small');
}

if ($secretKey === '') {
    fail(503, 'Payments are not configured yet');
}

/* ── Stripe Checkout Session ───────────────────────────────────────── */
$description = sprintf('%s · %s → %s · %d× · %d dana', $bikeId, $from, $to, $qty, $days);

$params = [
    'mode'                          => 'payment',
    'locale'                        => $locale,
    'client_reference_id'           => substr($bikeId . '-' . $from, 0, 200),
    'success_url'                   => $siteUrl . ($body['url'] ?? '/') . '?paid=1&session_id={CHECKOUT_SESSION_ID}',
    'cancel_url'                    => $siteUrl . ($body['url'] ?? '/') . '?canceled=1',
    'line_items[0][quantity]'       => 1,
    'line_items[0][price_data][currency]'              => $data['currency'],
    'line_items[0][price_data][unit_amount]'           => $amountCents,
    'line_items[0][price_data][product_data][name]'    => 'Akontacija — Rent a Bike Pula',
    'line_items[0][price_data][product_data][description]' => $description,
    'payment_intent_data[description]' => $description,
    'metadata[bike]'      => $bikeId,
    'metadata[sku]'       => (string) $bike['sku'],
    'metadata[from]'      => $from,
    'metadata[to]'        => $to,
    'metadata[days]'      => (string) $days,
    'metadata[qty]'       => (string) $qty,
    'metadata[size]'      => $size,
    'metadata[delivery]'  => $deliveryId,
    'metadata[extras]'    => json_encode($extraLines),
    'metadata[total_eur]' => number_format($total, 2, '.', ''),
    'metadata[deposit_eur]' => number_format($deposit, 2, '.', ''),
];

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($params),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $secretKey,
        'Stripe-Version: 2024-06-20',
        'Content-Type: application/x-www-form-urlencoded',
    ],
]);

$response = curl_exec($ch);
$status   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    error_log('[rabp] stripe curl error: ' . $curlErr);
    fail(502, 'Payment provider unreachable');
}

$session = json_decode((string) $response, true);
if ($status >= 400 || !isset($session['url'])) {
    // Poruka o grešci sa Stripea ide u log, ne gostu — može sadržavati
    // detalje o računu koji ne trebaju biti javni.
    error_log('[rabp] stripe error ' . $status . ': ' . substr((string) $response, 0, 500));
    fail(502, 'Could not start payment');
}

echo json_encode([
    'url'     => $session['url'],
    'total'   => $total,
    'deposit' => $deposit,
], JSON_UNESCAPED_UNICODE);
