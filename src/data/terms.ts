/**
 * Uvjeti najma i otkazivanja.
 *
 * Izvor je engleski tekst s postojeće stranice (prices.php), koji je bio
 * jedan blok od jedanaest rečenica u pravničkom nizu. Ovdje je razlomljen
 * na naslovljene točke — isto značenje, ali se može pročitati na mobitelu.
 * Iznosi naknada (10 € za lokot/pumpu/zračnicu) preuzeti su doslovno.
 *
 * ⚠ Prije objave: dati odvjetniku ili knjigovođi na provjeru, i uskladiti
 *    s Uvjetima poslovanja koje klijent već ima za listnride.
 */
export interface TermsSection { heading: string; body: string }
export interface TermsDoc {
  intro: string;
  sections: TermsSection[];
  cancellationHeading: string;
  cancellation: string[];
}

export const TERMS: Record<'hr' | 'en' | 'de' | 'it', TermsDoc> = {
  hr: {
    intro: 'Bicikli se iznajmljuju u tehnički ispravnom i čistom stanju. Molimo da ih pregledate pri preuzimanju i odmah prijavite eventualne nedostatke.',
    sections: [
      { heading: 'Rukovanje biciklom', body: 'Najmoprimac se obvezuje pažljivo rukovati biciklom i uvijek ga zaključati lokotom. Noću bicikl mora biti parkiran u zaključanom prostoru.' },
      { heading: 'Krađa', body: 'U slučaju krađe bicikla najmoprimac odgovara u iznosu aktualne prodajne cijene prema našem cjeniku.' },
      { heading: 'Što ide uz bicikl', body: 'Uz svaki bicikl idu pumpa, lokot, rezervna zračnica, zakrpe i montirke. U slučaju gubitka pumpe ili lokota naplaćuje se 10,00 €, jednako i za iskorištenu zračnicu. Završno čišćenje je na nama.' },
      { heading: 'Oštećenja', body: 'Za štetu nastalu padom ili nepravilnim rukovanjem odgovara najmoprimac. Popravke izvršene tijekom najma plaća najmoprimac na licu mjesta.' },
      { heading: 'Popravci kod drugih servisa', body: 'Ne preuzimamo troškove popravaka u tuđim radionicama tijekom trajanja najma. Naša radionica radi tijekom cijelog radnog vremena.' },
      { heading: 'Odgovornost', body: 'Najmoprimac je u Hrvatskoj odgovoran za sebe. Naša usluga preuzimanja bicikla s terena se naplaćuje. Odštetni zahtjevi prema trećim osobama su na najmoprimcu.' },
      { heading: 'Plaćanje', body: 'Cijene najma su fiksne i plative pri preuzimanju bicikla. Kod prijevremenog povrata novac se ne vraća — ni zbog vremenskih prilika, bolesti ni drugih razloga.' },
      { heading: 'Identifikacija', body: 'Bicikle iznajmljujemo isključivo uz predočenje osobne iskaznice ili putovnice.' },
      { heading: 'Preuzimanje i povrat', body: 'Isporuka i povrat bicikala odvijaju se svakodnevno od 8:00 do 20:00. Ako bicikl ne bude vraćen do kraja radnog vremena, zadržavamo pravo naplate punog dnevnog najma.' },
    ],
    cancellationHeading: 'Otkazivanje',
    cancellation: [
      'Otkazivanje se prijavljuje e-mailom na info.brbsport@gmail.com.',
      'Otkaz do 14 dana prije početka najma — povrat 100 % uplaćenog iznosa.',
      'Otkaz do 7 dana prije početka najma — povrat 50 % uplaćenog iznosa.',
      'Otkaz od 6. dana prije dolaska — uplaćeni iznos se ne vraća.',
    ],
  },

  en: {
    intro: 'Our bikes are rented out in technically perfect and clean condition. Please satisfy yourself of this at handover and report any defects immediately.',
    sections: [
      { heading: 'Handling the bike', body: 'The client undertakes to handle the bike with care and to always secure it with the lock. At night the bike must be parked in a secured, lockable room.' },
      { heading: 'Theft', body: 'In case of theft of the bike, the client is liable for the amount of the current sale price according to our price list.' },
      { heading: 'What comes with the bike', body: 'Every bike is handed over with a pump, lock, spare tube, puncture repair kit and tyre levers. Loss of the pump or lock is charged at €10.00, as is a used tube. Final cleaning is done by us.' },
      { heading: 'Damage', body: 'The client is liable for damage caused by falls or improper handling. Any repairs made during the rental must be paid locally by the client.' },
      { heading: 'Third-party workshops', body: 'We assume no costs for repairs carried out in third-party workshops during the rental period. Our own workshop is staffed throughout opening hours.' },
      { heading: 'Liability', body: 'The client is responsible for themselves in Croatia. Our pick-up service is charged separately. Liability claims against third parties are the responsibility of the client.' },
      { heading: 'Payment', body: 'Our rental prices are fixed and payable on taking over the bike. If the bike is returned early no money is refunded — including for bad weather, illness or other reasons.' },
      { heading: 'Identification', body: 'We rent our bikes only on presentation of an identity card or passport.' },
      { heading: 'Delivery and return', body: 'Bike delivery and return take place daily from 08:00 to 20:00. If the bike is not returned by the close of business at the end of the rental, we reserve the right to charge a full daily rate.' },
    ],
    cancellationHeading: 'Cancellation',
    cancellation: [
      'A cancellation must be made by email to info.brbsport@gmail.com.',
      'Cancel up to 14 days before your rental — 100 % of your payment is refunded.',
      'Cancel up to 7 days before your rental — 50 % of your payment is refunded.',
      'Cancellation from the 6th day before arrival — the payment is forfeited.',
    ],
  },

  de: {
    intro: 'Unsere Räder werden in technisch einwandfreiem und sauberem Zustand vermietet. Bitte überzeugen Sie sich bei der Übergabe davon und melden Sie Mängel sofort.',
    sections: [
      { heading: 'Umgang mit dem Rad', body: 'Der Mieter verpflichtet sich, das Rad sorgsam zu behandeln und stets mit dem Schloss zu sichern. Nachts muss das Rad in einem abschließbaren Raum abgestellt werden.' },
      { heading: 'Diebstahl', body: 'Bei Diebstahl haftet der Mieter in Höhe des aktuellen Verkaufspreises gemäß unserer Preisliste.' },
      { heading: 'Was zum Rad gehört', body: 'Jedes Rad wird mit Pumpe, Schloss, Ersatzschlauch, Flickzeug und Reifenhebern übergeben. Bei Verlust von Pumpe oder Schloss werden 10,00 € berechnet, ebenso für einen verbrauchten Schlauch. Die Endreinigung übernehmen wir.' },
      { heading: 'Schäden', body: 'Für Schäden durch Stürze oder unsachgemäße Behandlung haftet der Mieter. Während der Mietzeit vorgenommene Reparaturen sind vor Ort vom Mieter zu bezahlen.' },
      { heading: 'Fremdwerkstätten', body: 'Für Reparaturen in Fremdwerkstätten während der Mietzeit übernehmen wir keine Kosten. Unsere Werkstatt ist während der gesamten Öffnungszeiten besetzt.' },
      { heading: 'Haftung', body: 'Der Mieter ist in Kroatien für sich selbst verantwortlich. Unser Abholservice wird berechnet. Haftungsansprüche gegenüber Dritten liegen beim Mieter.' },
      { heading: 'Zahlung', body: 'Unsere Mietpreise sind Festpreise und bei Übernahme des Rades fällig. Bei vorzeitiger Rückgabe wird kein Geld erstattet — auch nicht wegen Wetter, Krankheit oder anderer Gründe.' },
      { heading: 'Ausweis', body: 'Wir vermieten unsere Räder ausschließlich gegen Vorlage von Personalausweis oder Reisepass.' },
      { heading: 'Übergabe und Rückgabe', body: 'Lieferung und Rückgabe erfolgen täglich von 08:00 bis 20:00 Uhr. Wird das Rad am Mietende nicht bis Geschäftsschluss zurückgegeben, behalten wir uns vor, einen vollen Tagessatz zu berechnen.' },
    ],
    cancellationHeading: 'Stornierung',
    cancellation: [
      'Stornierungen bitte per E-Mail an info.brbsport@gmail.com.',
      'Stornierung bis 14 Tage vor Mietbeginn — 100 % Rückerstattung.',
      'Stornierung bis 7 Tage vor Mietbeginn — 50 % Rückerstattung.',
      'Stornierung ab dem 6. Tag vor Anreise — keine Rückerstattung.',
    ],
  },

  it: {
    intro: 'Le nostre bici vengono noleggiate in condizioni tecniche perfette e pulite. Vi preghiamo di verificarlo alla consegna e di segnalare subito eventuali difetti.',
    sections: [
      { heading: 'Uso della bici', body: 'Il cliente si impegna a trattare la bici con cura e ad assicurarla sempre con il lucchetto. Di notte la bici deve essere parcheggiata in un locale chiuso a chiave.' },
      { heading: 'Furto', body: 'In caso di furto il cliente risponde per l’importo del prezzo di vendita corrente secondo il nostro listino.' },
      { heading: 'Cosa è compreso', body: 'Ogni bici viene consegnata con pompa, lucchetto, camera d’aria di scorta, kit di riparazione e leve. In caso di perdita di pompa o lucchetto si addebitano 10,00 €, così come per la camera usata. La pulizia finale è a nostro carico.' },
      { heading: 'Danni', body: 'Il cliente risponde dei danni causati da cadute o uso improprio. Le riparazioni effettuate durante il noleggio sono pagate sul posto dal cliente.' },
      { heading: 'Officine terze', body: 'Non ci assumiamo i costi di riparazioni presso officine terze durante il periodo di noleggio. La nostra officina è presidiata per tutto l’orario di apertura.' },
      { heading: 'Responsabilità', body: 'In Croazia il cliente è responsabile di sé stesso. Il servizio di recupero è a pagamento. Le richieste di risarcimento verso terzi sono a carico del cliente.' },
      { heading: 'Pagamento', body: 'I prezzi di noleggio sono fissi e si pagano al ritiro della bici. In caso di riconsegna anticipata non si effettuano rimborsi — nemmeno per maltempo, malattia o altri motivi.' },
      { heading: 'Documento', body: 'Noleggiamo le bici solo dietro presentazione di carta d’identità o passaporto.' },
      { heading: 'Consegna e riconsegna', body: 'Consegna e riconsegna avvengono ogni giorno dalle 08:00 alle 20:00. Se la bici non viene riconsegnata entro la chiusura al termine del noleggio, ci riserviamo di addebitare una giornata intera.' },
    ],
    cancellationHeading: 'Cancellazione',
    cancellation: [
      'La cancellazione va comunicata via email a info.brbsport@gmail.com.',
      'Cancellazione fino a 14 giorni prima del noleggio — rimborso del 100 %.',
      'Cancellazione fino a 7 giorni prima del noleggio — rimborso del 50 %.',
      'Cancellazione dal 6º giorno prima dell’arrivo — nessun rimborso.',
    ],
  },
};
