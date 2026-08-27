<?php
/**
 * Kopirati na serveru u `api/config.php` i upisati stvarne vrijednosti.
 *
 * `config.php` NIKAD ne ide u repozitorij ni u build (vidi .gitignore) —
 * tajni Stripe ključ smije postojati samo na serveru.
 *
 * Postavljanje:
 *   1. Stripe Dashboard → Developers → API keys → Secret key (sk_live_…).
 *      Za testiranje koristiti sk_test_… i testnu karticu 4242 4242 4242 4242.
 *   2. FTP-om kopirati ovu datoteku u /api/config.php i upisati ključ.
 *   3. U src/components/pages/BikeDetail.astro postaviti
 *      data-booking-mode="live" i data-booking-endpoint="/api/checkout.php".
 *   4. Rebuild i deploy.
 *
 * Provjeriti da hosting ima uključen cURL (većina ima) i PHP 8.0+.
 */

return [
    'stripe_secret_key' => '',                             // sk_live_… ili sk_test_…
    'site_url'          => 'https://rentabikepula.com',
];
