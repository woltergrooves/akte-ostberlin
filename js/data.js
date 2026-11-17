// ===================== DATA: Akte — Ost-Berlin 1985–1989 =====================

// Beurten: drie per jaar (voorjaar, zomer, herfst), 1989 versnelt naar de val van de Muur
export const TURNS = (() => {
  const seasons = ["Voorjaar", "Zomer", "Herfst"];
  const out = [];
  for (let y = 1985; y <= 1988; y++) seasons.forEach((n, s) => out.push({ y, s, label: `${n} ${y}`, key: `${y}-${s}`, first: s === 0, review: s === 2, winter: s !== 1 }));
  out.push({ y: 1989, s: 1, label: "Zomer 1989", key: "1989-zomer", first: true, flight: true });
  out.push({ y: 1989, s: 2, label: "7 oktober 1989", key: "1989-okt", late: true, winter: false });
  out.push({ y: 1989, s: 2, label: "9 november 1989", key: "1989-nov", late: true, winter: true });
  return out;
})();

export const RANKS = [
  { id: "Leutnant", mk: 3, ims: 3, bugs: 1 },
  { id: "Oberleutnant", mk: 4, ims: 4, bugs: 2 },
  { id: "Hauptmann", mk: 5, ims: 6, bugs: 3 },
  { id: "Major", mk: 6, ims: 8, bugs: 4 },
];

// Gebouwen in de wijk (grid x,z), type bepaalt 3D-model
export const BUILDINGS = [
  { id: "kollwitz", name: "Kollwitzstraße 12", kind: "altbau", x: -2, z: -2, color: 0xb59a7a, res: true, desc: "Altbau, vijf verdiepingen, kolenkachels. Hier woon jij." },
  { id: "lychener", name: "Lychener Straße 40", kind: "altbau", x: -3, z: 2, color: 0x9a8f80, res: true, desc: "Grauwe Altbau met kogelgaten uit 1945 in de gevel." },
  { id: "greif", name: "Plattenbau Greifswalder Str.", kind: "platte", x: 3, z: -2, color: 0xc9c3b4, res: true, desc: "WBS-70 Plattenbau, 120 woningen. Lift doet het soms." },
  { id: "dimi", name: "Plattenbau Dimitroffstraße", kind: "platte", x: 3, z: 1, color: 0xbdb8a8, res: true, desc: "Nieuwbouw uit 1982. Dunne muren." },
  { id: "kerk", name: "Zionskirche", kind: "kerk", x: 0, z: -2, color: 0x8e6e5a, work: true, desc: "Evangelische kerk. In de kelder: een ‘bibliotheek’." },
  { id: "fabriek", name: "VEB Bergmann-Borsig", kind: "fabriek", x: -4, z: 0, color: 0x7d7468, work: true, desc: "Machinefabriek, 3.000 arbeiders." },
  { id: "school", name: "EOS Carl von Ossietzky", kind: "school", x: -1, z: 2, color: 0xc4a36e, work: true, desc: "Uitgebreide middelbare school." },
  { id: "kliniek", name: "Poliklinik Prenzlauer Berg", kind: "kliniek", x: 1, z: 2, color: 0xd6d2c4, work: true, desc: "Huisartsen, tandartsen, altijd wachtrijen." },
  { id: "cafe", name: "Café Mosaik", kind: "cafe", x: -1, z: 0, color: 0x6f5a4a, work: true, desc: "Kunstenaars, dichters, rook. Veel rook." },
  { id: "konsum", name: "Kaufhalle (Konsum)", kind: "konsum", x: 1, z: 0, color: 0xa7b1a0, work: true, desc: "Wie er rijen ziet, gaat erin staan." },
  { id: "mfs", name: "Kreisdienststelle MfS", kind: "mfs", x: 4, z: 0, color: 0x6a6d6a, desc: "Jouw kantoor. Geen naambord." },
];

export const WORKPLACES = {
  kerk: { name: "Zionskirche", paper: "stencilpapier van een kerkelijke drukpers" },
  fabriek: { name: "VEB Bergmann-Borsig", paper: "doorslagpapier met fabrieksstempel" },
  school: { name: "EOS Carl von Ossietzky", paper: "gelinieerd schoolpapier" },
  kliniek: { name: "Poliklinik", paper: "achterkanten van receptformulieren" },
  cafe: { name: "Café Mosaik", paper: "bierviltjes en kassarol" },
  konsum: { name: "Kaufhalle", paper: "bruin pakpapier" },
  uni: { name: "Humboldt-Universität", paper: "dun collegepapier" },
};

export const TYPEWRITERS = [
  { id: "tw1", label: "Erika-typemachine, scheve ‘e’" },
  { id: "tw2", label: "Erika-typemachine, ‘t’ slaat door" },
  { id: "tw3", label: "Olympia-typemachine, dichtgelopen ‘o’" },
  { id: "tw4", label: "Robotron-typemachine, springende ‘a’" },
];

export const TRAITS = {
  rias: { l: "Luistert naar RIAS en West-tv", dis: 4 },
  westfam: { l: "Familie in de Bondsrepubliek", lev: 2 },
  kerk: { l: "Actief in de kerkgemeente", dis: 10 },
  ausreise: { l: "Overweegt een uitreisaanvraag", dis: 14, lev: 2 },
  affaire: { l: "Heeft een buitenechtelijke affaire", lev: 3 },
  schulden: { l: "Diep in de schulden", lev: 3 },
  zwart: { l: "Handelt zwart in Westmark", lev: 3 },
  drank: { l: "Drinkt te veel", lev: 1 },
  kindstudie: { l: "Kind wil gaan studeren", lev: 2 },
  milieu: { l: "Betrokken bij milieugroep", dis: 20 },
  vrede: { l: "Draagt ‘Zwaarden tot ploegscharen’", dis: 14 },
  samizdat: { l: "Verspreidt verboden lectuur", dis: 25 },
  vlucht: { l: "Praat over vluchten", dis: 18 },
  punk: { l: "Gaat naar punkconcerten", dis: 10 },
  loyaal: { l: "Overtuigd SED-lid", dis: -25 },
  klager: { l: "Schrijft klachtbrieven (Eingaben)", dis: 6 },
  tw1: { l: TYPEWRITERS[0].label, tw: 1 },
  tw2: { l: TYPEWRITERS[1].label, tw: 1 },
  tw3: { l: TYPEWRITERS[2].label, tw: 1 },
  tw4: { l: TYPEWRITERS[3].label, tw: 1 },
};
export const FAKEABLE = ["rias", "samizdat", "vlucht", "milieu", "zwart", "ausreise", "vrede", "punk"];

const FN_M = ["Uwe","Jörg","Frank","Ralf","Andreas","Holger","Steffen","Matthias","Bernd","Wolfgang","Rainer","Lutz","Detlef","Peter","Jens","Mario","Torsten","Gerd"];
const FN_F = ["Petra","Sabine","Kerstin","Heike","Birgit","Simone","Manuela","Ute","Monika","Gabi","Silke","Anja","Katja","Doris","Ines","Karin","Elke","Martina"];
const LN = ["Müller","Schmidt","Krüger","Hoffmann","Lehmann","Neumann","Schwarz","Zimmermann","Braun","Hartmann","Lange","Werner","Krause","Meier","Wolf","Fiedler","Seidel","Köhler","Pietsch","Ziegler","Böhme","Winkler","Lorenz","Jahn","Hahn","Kaiser","Frenzel","Engel"];
const JOBS = {
  kerk: ["koster","diaken","organist","kerkelijk medewerker"],
  fabriek: ["draaier","lasser","monteur","ingenieur","technisch tekenaar","ploegleider"],
  school: ["lerares Russisch","leraar wiskunde","leraar sport","secretaresse"],
  kliniek: ["verpleegkundige","tandarts","huisarts","laborante"],
  cafe: ["serveerster","kok","barman","dichter (zonder vergunning)","schilder"],
  konsum: ["caissière","vakkenvuller","filiaalchef"],
  uni: ["student filosofie","studente biologie","assistent-docent"],
};

// Vaste verhaalpersonages
export const STORY_PEOPLE = [
  { id: "brandt", fn: "Dieter", ln: "Brandt", age: 34, sex: "m", job: "automonteur", work: "fabriek", home: "lychener", traits: ["rias", "drank", "tw3"], dis: 15, loyal: 40 },
  { id: "kuehn", fn: "Martin", ln: "Kühn", age: 46, sex: "m", job: "dominee", work: "kerk", home: "kollwitz", traits: ["kerk", "milieu", "vrede", "tw1"], dis: 55, loyal: 10 },
  { id: "anna", fn: "Anna", ln: "Weiss", age: 22, sex: "f", job: "studente geneeskunde", work: "uni", home: "greif", traits: ["ausreise", "westfam", "rias"], dis: 30, loyal: 20 },
  { id: "herta", fn: "Herta", ln: "Schulz", age: 58, sex: "f", job: "conciërge", work: "konsum", home: "greif", traits: ["kindstudie", "loyaal"], dis: 0, loyal: 70 },
  { id: "lena", fn: "Lena", ln: "Vogt", age: 41, sex: "f", job: "verpleegkundige", work: "kliniek", home: "dimi", traits: ["westfam", "klager"], dis: 20, loyal: 35 },
  { id: "richter", fn: "Klaus", ln: "Richter", age: 45, sex: "m", job: "leraar geschiedenis", work: "school", home: "dimi", traits: ["kerk", "tw4"], dis: 25, loyal: 30 },
  { id: "jutta", fn: "Jutta", ln: "Lang", age: 38, sex: "f", job: "architecte", work: "cafe", home: "kollwitz", traits: ["samizdat", "milieu", "tw2"], dis: 45, loyal: 10 },
  { id: "thomas", fn: "Thomas", ln: "", age: 36, sex: "m", job: "ingenieur — jouw broer", work: "fabriek", home: "lychener", traits: ["rias", "klager"], dis: 15, loyal: 40, family: true },
  { id: "pohl", fn: "Erich", ln: "Pohl", age: 67, sex: "m", job: "gepensioneerd spoorman — je buurman", work: null, home: "kollwitz", traits: ["loyaal"], dis: 0, loyal: 95, secretIM: true },
  { id: "micha", fn: "Micha", ln: "Seidel", age: 19, sex: "m", job: "leerling-lasser, punk", work: "fabriek", home: "dimi", traits: ["punk", "vrede", "vlucht"], dis: 40, loyal: 5 },
];

export function makeRng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function generatePeople(seed) {
  const r = makeRng(seed);
  const pick = a => a[Math.floor(r() * a.length)];
  const people = STORY_PEOPLE.map(p => ({ ...p, traits: [...p.traits] }));
  const homes = ["kollwitz", "lychener", "greif", "greif", "dimi", "dimi"];
  const works = ["kerk", "fabriek", "fabriek", "school", "kliniek", "cafe", "cafe", "konsum", "uni"];
  const usedNames = new Set(people.map(p => p.fn + p.ln));
  const extraTraits = ["rias", "westfam", "kerk", "affaire", "schulden", "zwart", "drank", "kindstudie", "milieu", "vrede", "samizdat", "vlucht", "punk", "loyaal", "klager", "ausreise"];
  for (let i = 0; i < 22; i++) {
    const sex = r() < 0.5 ? "m" : "f";
    let fn, ln;
    do { fn = pick(sex === "m" ? FN_M : FN_F); ln = pick(LN); } while (usedNames.has(fn + ln));
    usedNames.add(fn + ln);
    const work = pick(works);
    const traits = new Set();
    const n = 1 + Math.floor(r() * 3);
    while (traits.size < n) traits.add(pick(extraTraits));
    if (traits.has("loyaal")) ["samizdat", "milieu", "vlucht", "punk"].forEach(t => traits.delete(t));
    if (r() < 0.38) traits.add(pick(TYPEWRITERS).id);
    let dis = Math.round(r() * 15);
    traits.forEach(t => dis += TRAITS[t].dis || 0);
    people.push({ id: "p" + i, fn, ln, sex, age: 19 + Math.floor(r() * 48), job: pick(JOBS[work]), work, home: pick(homes), traits: [...traits], dis: Math.max(0, Math.min(90, dis)), loyal: Math.round(traits.has("loyaal") ? 60 + r() * 35 : r() * 60) });
  }
  return people.map(p => ({
    ...p,
    name: p.ln ? `${p.fn} ${p.ln}` : p.fn,
    known: {},          // traitId -> "zeker" | "IM" (onbevestigd)
    status: "vrij",     // vrij | im | gevangen | zersetzt | uitgereisd | gevlucht | overgeplaatst
    pages: 0,           // dikte van het dossier
    log: [],            // wat jij met deze persoon deed (voor epiloog)
    fear: 10,
    honesty: Math.round(30 + r() * 70), // als IM: kans dat rapport waar is
    doubleAgent: r() < 0.12 && p.dis > 30,
  }));
}

// Pamfletten / anonieme acties — sjablonen
export const INCIDENTS = [
  { t: "Een anoniem pamflet", d: "‘Wij willen geen land waar je je eigen buren moet vrezen.’ Gevonden in brievenbussen." },
  { t: "Leuzen op een muur", d: "Op een gevel staat in witte verf: ‘GORBI GORBI’. Erbij een getypt briefje met de tekst van artikel 27 van de grondwet: vrijheid van meningsuiting." },
  { t: "Een getypte oproep", d: "Een oproep om op de 7e van de maand met een kaars naar de Alexanderplatz te komen." },
  { t: "Een samizdat-blad", d: "Zes getypte pagina's, ‘Umweltblätter’, over de luchtvervuiling in Bitterfeld." },
  { t: "Een open brief", d: "Een brief aan de Volkskammer over reisvrijheid, met de oproep hem over te typen en door te geven." },
  { t: "Een spotgedicht", d: "Een getypt gedicht over een ‘oude man met een hoed die de toekomst niet ziet’." },
];

// Afgeluisterde fragmenten per trait (Wanze / telefoontap)
export const OVERHEARD = {
  rias: ["‘Heb je gisteren het journaal van de ARD gezien?’", "‘Zet hem harder, het is de RIAS-hitparade.’"],
  westfam: ["‘Tante Gerda stuurt weer een pakket uit Keulen.’", "‘Mijn broer in Hamburg heeft een nieuwe Golf.’"],
  kerk: ["‘Zondag na de dienst blijven we nog even.’"],
  ausreise: ["‘Als we het formulier indienen, verliezen we allebei ons werk.’"],
  affaire: ["‘Mijn man is dinsdag laat thuis, kom dan.’", "‘Niemand mag van ons weten.’"],
  schulden: ["‘Ik kan het hem deze maand niet terugbetalen.’"],
  zwart: ["‘Vijf West voor een fles, ja of nee?’"],
  drank: ["(geluid van flessen) ‘Nog eentje dan.’"],
  kindstudie: ["‘Als hij op de EOS komt, kan hij later medicijnen studeren.’"],
  milieu: ["‘De metingen in de Pleiße zijn nog erger dan vorig jaar.’"],
  vrede: ["‘Ze willen dat ik het embleem van mijn jas haal. Ik doe het niet.’"],
  samizdat: ["‘Ik heb twintig doorslagen gemaakt, meer gaat er niet in de machine.’"],
  vlucht: ["‘Via Hongarije, zeggen ze. Over het meer.’"],
  punk: ["‘Zaterdag spelen ze in de kerk, zeg het niemand.’"],
  loyaal: ["‘De partij weet wat ze doet. Klaar.’"],
  klager: ["‘Ik schrijf weer een Eingabe over de verwarming. Derde keer.’"],
  tw: ["(getik van een typemachine, lang)", "‘Het lint is bijna op, en de ’e’ staat weer scheef.’"],
};
