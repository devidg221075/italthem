// Privacy notice (DRAFT, to be validated by the owner / a privacy consultant; see docs/CHANGES.md).
// Written for the site as built: no database, no analytics, one technical cookie. Placeholders: [[mail]], [[garante]].
export const PRIVACY = {
  en: {
    title: 'Privacy notice',
    lead: 'Information pursuant to Art. 13 of Regulation (EU) 2016/679 (GDPR) on the personal data processed through this website.',
    updated: (y) => `Last updated: ${y}`,
    crumb: 'Home',
    sections: [
      { h: 'Data controller', p: ['The controller is ITALTHERM S.r.l., P.IVA 02487940518, REA Arezzo 220552, Viale S. Maria delle Vertighe, 50/B, 52048 Monte San Savino (AR), Italy. Contact: [[mail]].'] },
      { h: 'What data we collect and why', p: ['We process personal data only when you send us a request through the contact form, in order to answer it. The data are:'], ul: ['first name, last name and email address;', 'the text of your message;', 'the product you were looking at, if you reached the form from a product page;', 'your IP address, browser identifier (user agent) and the date and time of the request, which are added to the notification email we receive.'], after: ['Name, email address and message are needed to reply: without them we cannot handle your request. The IP address is also used for a few minutes to one hour, in a hashed form, to limit repeated submissions (anti-abuse).'] },
      { h: 'Legal basis', p: ['Handling your request is necessary to take steps at your request (Art. 6(1)(b) GDPR); by ticking the privacy box you also confirm that you have read this notice. Technical data and the anti-abuse check rely on our legitimate interest in keeping the form secure (Art. 6(1)(f) GDPR).'] },
      { h: 'Retention', p: ['The site has no database: your request exists as an email in our mailbox. We keep it for as long as needed to answer you and, afterwards, for as long as required by legal obligations or to defend our rights. The anti-abuse record (hashed IP address and timestamps) is deleted automatically after about one hour.'] },
      { h: 'Recipients', p: ['Data are handled by authorised ITALTHERM staff. Our hosting and email service providers act as data processors and only process data on our behalf. We do not sell your data and do not use it for advertising.'] },
      { h: 'Cookies and third parties', p: ['This site does not use tracking, analytics or advertising cookies, and it does not load third-party scripts, fonts or embedded content when you open a page. The only cookie is a first-party technical cookie named it_notice, which remembers that you closed the notice bar; it expires after about six months. Maps, where shown, are loaded only after you click on them.'] },
      { h: 'Your rights', p: ['You can ask us at any time for access to your data, rectification, erasure, restriction of processing, data portability and object to the processing (Art. 15-22 GDPR), and withdraw any consent given. To exercise your rights write to [[mail]]; we will reply as soon as possible and in any case within one month.'] },
      { h: 'Complaints', p: ['If you believe your data are processed unlawfully you have the right to lodge a complaint with the Italian data protection authority, the Garante per la protezione dei dati personali ([[garante]]).'] },
    ],
  },
  it: {
    title: 'Informativa sulla privacy',
    lead: 'Informativa ai sensi dell’Art. 13 del Regolamento (UE) 2016/679 (GDPR) sui dati personali trattati attraverso questo sito.',
    updated: (y) => `Ultimo aggiornamento: ${y}`,
    crumb: 'Home',
    sections: [
      { h: 'Titolare del trattamento', p: ['Il titolare del trattamento è ITALTHERM S.r.l., P.IVA 02487940518, REA Arezzo 220552, Viale S. Maria delle Vertighe, 50/B, 52048 Monte San Savino (AR), Italia. Contatto: [[mail]].'] },
      { h: 'Quali dati raccogliamo e perché', p: ['Trattiamo dati personali solo quando ci invii una richiesta tramite il modulo di contatto, per risponderti. I dati sono:'], ul: ['nome, cognome e indirizzo email;', 'il testo del messaggio;', 'il prodotto che stavi consultando, se sei arrivato al modulo da una pagina prodotto;', 'il tuo indirizzo IP, l’identificativo del browser (user agent) e la data e l’ora della richiesta, che vengono aggiunti all’email di notifica che riceviamo.'], after: ['Nome, email e messaggio sono necessari per risponderti: senza di essi non possiamo gestire la richiesta. L’indirizzo IP viene inoltre usato, in forma di hash, per un periodo da pochi minuti a un’ora per limitare l’invio ripetuto di richieste (misura anti-abuso).'] },
      { h: 'Base giuridica', p: ['La gestione della tua richiesta è necessaria per dare seguito a una tua richiesta (Art. 6, par. 1, lett. b GDPR); selezionando la casella sulla privacy confermi inoltre di aver letto questa informativa. I dati tecnici e il controllo anti-abuso si basano sul nostro legittimo interesse a mantenere sicuro il modulo (Art. 6, par. 1, lett. f GDPR).'] },
      { h: 'Conservazione', p: ['Il sito non ha un database: la tua richiesta esiste come email nella nostra casella di posta. La conserviamo per il tempo necessario a risponderti e, successivamente, per il tempo richiesto da obblighi di legge o per la tutela dei nostri diritti. Il dato anti-abuso (indirizzo IP in forma di hash e orari) viene cancellato automaticamente dopo circa un’ora.'] },
      { h: 'Destinatari', p: ['I dati sono trattati dal personale autorizzato di ITALTHERM. I fornitori di hosting e di posta elettronica operano come responsabili del trattamento e trattano i dati solo per nostro conto. Non vendiamo i tuoi dati e non li usiamo per pubblicità.'] },
      { h: 'Cookie e terze parti', p: ['Questo sito non usa cookie di tracciamento, di analisi statistica o pubblicitari e, all’apertura di una pagina, non carica script, font o contenuti incorporati di terze parti. L’unico cookie è un cookie tecnico di prima parte chiamato it_notice, che ricorda che hai chiuso l’avviso in basso; scade dopo circa sei mesi. Le mappe, dove presenti, vengono caricate solo dopo un tuo clic.'] },
      { h: 'I tuoi diritti', p: ['Puoi chiederci in qualsiasi momento l’accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del trattamento, la portabilità e opporti al trattamento (Artt. 15-22 GDPR), nonché revocare un eventuale consenso. Per esercitare i tuoi diritti scrivi a [[mail]]; risponderemo il prima possibile e comunque entro un mese.'] },
      { h: 'Reclami', p: ['Se ritieni che il trattamento dei tuoi dati sia illecito hai il diritto di proporre reclamo all’autorità di controllo italiana, il Garante per la protezione dei dati personali ([[garante]]).'] },
    ],
  },
};
