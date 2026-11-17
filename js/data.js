// ===================== DATA: Akte — East Berlin 1983–1989 =====================
// All in-game text is English. German only for period terms (IM, Zersetzung, Kaufhalle, ...).

// Beurten: vier per jaar, extra beurten in 1987 en in de herfst van 1989 (32 in totaal).
// Elke beurt hoort bij een echte gebeurtenis; datums gecontroleerd met webbronnen (zie ROADMAP.md, fase 3).
// first = begin jaardoel, review = jaarbeoordeling, winter = sneeuw/kachelrook, flight = vluchtgolf, late = geen losse gebeurtenissen
const tu = (y, m, key, o = {}) => ({ y, label: `${m} ${y}`, key, ...o });
export const TURNS = [
  tu(1983, "March", "1983-mrt", { first: true, winter: true }),
  tu(1983, "June", "1983-jun"),
  tu(1983, "September", "1983-sep"),              // 24 sept.: Schwerter zu Pflugscharen in Wittenberg
  tu(1983, "December", "1983-dec", { review: true, winter: true }), // 12 dec.: arrestatie Bohley en Poppe
  tu(1984, "March", "1984-mrt", { first: true, winter: true }),     // uitreisgolf, ±40.000 in 1984
  tu(1984, "June", "1984-jun"),                    // 27 juni: Ständige Vertretung gesloten
  tu(1984, "September", "1984-sep"),
  tu(1984, "December", "1984-dec", { review: true, winter: true }),
  tu(1985, "March", "1985-mrt", { first: true, winter: true }),     // 11 maart: Gorbatsjov
  tu(1985, "June", "1985-jun"),
  tu(1985, "September", "1985-sep"),
  tu(1985, "December", "1985-dec", { review: true, winter: true }),
  tu(1986, "March", "1986-mrt", { first: true, winter: true }),
  tu(1986, "May", "1986-mei"),                     // 26 april: Tsjernobyl
  tu(1986, "September", "1986-sep"),               // 2 sept.: Umwelt-Bibliothek in de Zionskirche
  tu(1986, "December", "1986-dec", { review: true, winter: true }),
  tu(1987, "March", "1987-mrt", { first: true, winter: true }),
  tu(1987, "June", "1987-jun"),                    // 6–8 juni: Concert for Berlin bij de Rijksdag
  tu(1987, "September", "1987-sep"),               // 7–11 sept.: Honecker in de Bondsrepubliek
  tu(1987, "October", "1987-okt"),                 // 17 okt.: skinheads in de Zionskirche
  tu(1987, "November", "1987-nov", { review: true, winter: true }), // 24/25 nov.: inval Umwelt-Bibliothek
  tu(1988, "January", "1988-jan", { first: true, winter: true }),   // 17 jan.: Liebknecht-Luxemburg
  tu(1988, "April", "1988-apr"),
  tu(1988, "July", "1988-jul"),                    // 19 juli: Springsteen in Weißensee
  tu(1988, "November", "1988-nov", { review: true, winter: true }), // 19 nov.: Sputnik geschrapt
  tu(1989, "February", "1989-feb", { first: true, winter: true }),  // 5 feb.: Chris Gueffroy
  tu(1989, "May", "1989-mei"),                     // 7 mei: gemeenteraadsverkiezingen
  tu(1989, "August", "1989-aug", { flight: true }),  // 19 aug.: Paneuropees picknick
  tu(1989, "September", "1989-sep", { flight: true }), // 9/10 sept.: Neues Forum, 11 sept.: Hongarije open
  { y: 1989, label: "7 October 1989", key: "1989-okt", late: true },
  { y: 1989, label: "4 November 1989", key: "1989-nov4", late: true, winter: true },
  { y: 1989, label: "9 November 1989", key: "1989-nov", late: true, winter: true },
];
export const turnIndex = key => TURNS.findIndex(t => t.key === key);

export const RANKS = [
  { id: "Leutnant", mk: 3, ims: 3, bugs: 1 },
  { id: "Oberleutnant", mk: 4, ims: 4, bugs: 2 },
  { id: "Hauptmann", mk: 5, ims: 6, bugs: 3 },
  { id: "Major", mk: 6, ims: 8, bugs: 4 },
];

// Gebouwen in de wijk (grid x,z), type bepaalt 3D-model
export const BUILDINGS = [
  { id: "kollwitz", name: "Kollwitzstraße 12", kind: "altbau", x: -2, z: -2, color: 0xb59a7a, res: true, desc: "Altbau, five storeys, coal stoves. You live here." },
  { id: "lychener", name: "Lychener Straße 40", kind: "altbau", x: -3, z: 2, color: 0x9a8f80, res: true, desc: "Grey Altbau with bullet holes from 1945 in the facade." },
  { id: "greif", name: "Plattenbau Greifswalder Str.", kind: "platte", x: 3, z: -2, color: 0xc9c3b4, res: true, desc: "WBS 70 Plattenbau, 120 flats. The lift works, sometimes." },
  { id: "dimi", name: "Plattenbau Dimitroffstraße", kind: "platte", x: 3, z: 1, color: 0xbdb8a8, res: true, desc: "New build from 1982. Thin walls." },
  { id: "kerk", name: "Zionskirche", kind: "kerk", x: 0, z: -2, color: 0x8e6e5a, work: true, desc: "Protestant church. In the cellar: a ‘library’." },
  { id: "fabriek", name: "VEB Bergmann-Borsig", kind: "fabriek", x: -4, z: 0, color: 0x7d7468, work: true, desc: "Engineering works, 3,000 workers." },
  { id: "school", name: "EOS Carl von Ossietzky", kind: "school", x: -1, z: 2, color: 0xc4a36e, work: true, desc: "Extended secondary school (sixth form)." },
  { id: "kliniek", name: "Poliklinik Prenzlauer Berg", kind: "kliniek", x: 1, z: 2, color: 0xd6d2c4, work: true, desc: "GPs, dentists, always a queue." },
  { id: "cafe", name: "Café Mosaik", kind: "cafe", x: -1, z: 0, color: 0x6f5a4a, work: true, desc: "Artists, poets, smoke. Lots of smoke." },
  { id: "konsum", name: "Kaufhalle (Konsum)", kind: "konsum", x: 1, z: 0, color: 0xa7b1a0, work: true, desc: "If you see a queue, you join it." },
  { id: "mfs", name: "Kreisdienststelle MfS", kind: "mfs", x: 4, z: 0, color: 0x6a6d6a, desc: "Your office. No nameplate." },
];

export const WORKPLACES = {
  kerk: { name: "Zionskirche", paper: "stencil paper from a church duplicator" },
  fabriek: { name: "VEB Bergmann-Borsig", paper: "carbon copy paper with a factory stamp" },
  school: { name: "EOS Carl von Ossietzky", paper: "lined school paper" },
  kliniek: { name: "Poliklinik", paper: "the backs of prescription forms" },
  cafe: { name: "Café Mosaik", paper: "beer mats and till roll" },
  konsum: { name: "Kaufhalle", paper: "brown wrapping paper" },
  uni: { name: "Humboldt-Universität", paper: "thin lecture paper" },
};

export const TYPEWRITERS = [
  { id: "tw1", label: "Erika typewriter, crooked ‘e’" },
  { id: "tw2", label: "Erika typewriter, ‘t’ punches through" },
  { id: "tw3", label: "Olympia typewriter, clogged ‘o’" },
  { id: "tw4", label: "Robotron typewriter, jumping ‘a’" },
];

export const TRAITS = {
  rias: { l: "Listens to RIAS and West German TV", dis: 4 },
  westfam: { l: "Has family in West Germany", lev: 2 },
  kerk: { l: "Active in the church congregation", dis: 10 },
  ausreise: { l: "Considering an exit application", dis: 14, lev: 2 },
  affaire: { l: "Having an extramarital affair", lev: 3 },
  schulden: { l: "Deep in debt", lev: 3 },
  zwart: { l: "Black-market dealing in West marks", lev: 3 },
  drank: { l: "Drinks too much", lev: 1 },
  kindstudie: { l: "Child wants to go to university", lev: 2 },
  milieu: { l: "Involved in an environmental group", dis: 20 },
  vrede: { l: "Wears ‘Swords into Ploughshares’", dis: 14 },
  samizdat: { l: "Distributes banned literature", dis: 25 },
  vlucht: { l: "Talks about escaping", dis: 18 },
  punk: { l: "Goes to punk gigs", dis: 10 },
  loyaal: { l: "Committed SED member", dis: -25 },
  klager: { l: "Writes complaint letters (Eingaben)", dis: 6 },
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
  kerk: ["sexton","deacon","organist","church worker"],
  fabriek: ["lathe operator","welder","fitter","engineer","draughtsman","shift foreman"],
  school: ["Russian teacher","maths teacher","PE teacher","school secretary"],
  kliniek: ["nurse","dentist","GP","lab assistant"],
  cafe: ["waitress","cook","barman","poet (unlicensed)","painter"],
  konsum: ["cashier","shelf stacker","store manager"],
  uni: ["philosophy student","biology student","teaching assistant"],
};

// Vaste verhaalpersonages
export const STORY_PEOPLE = [
  { id: "brandt", fn: "Dieter", ln: "Brandt", age: 34, sex: "m", job: "car mechanic", work: "fabriek", home: "lychener", traits: ["rias", "drank", "tw3"], dis: 15, loyal: 40 },
  { id: "kuehn", fn: "Martin", ln: "Kühn", age: 46, sex: "m", job: "pastor", work: "kerk", home: "kollwitz", traits: ["kerk", "milieu", "vrede", "tw1"], dis: 55, loyal: 10 },
  { id: "anna", fn: "Anna", ln: "Weiss", age: 22, sex: "f", job: "medical student", work: "uni", home: "greif", traits: ["ausreise", "westfam", "rias"], dis: 30, loyal: 20 },
  { id: "herta", fn: "Herta", ln: "Schulz", age: 58, sex: "f", job: "caretaker", work: "konsum", home: "greif", traits: ["kindstudie", "loyaal"], dis: 0, loyal: 70 },
  { id: "lena", fn: "Lena", ln: "Vogt", age: 41, sex: "f", job: "nurse", work: "kliniek", home: "dimi", traits: ["westfam", "klager"], dis: 20, loyal: 35 },
  { id: "richter", fn: "Klaus", ln: "Richter", age: 45, sex: "m", job: "history teacher", work: "school", home: "dimi", traits: ["kerk", "tw4"], dis: 25, loyal: 30 },
  { id: "jutta", fn: "Jutta", ln: "Lang", age: 38, sex: "f", job: "architect", work: "cafe", home: "kollwitz", traits: ["samizdat", "milieu", "tw2"], dis: 45, loyal: 10 },
  { id: "thomas", fn: "Thomas", ln: "", age: 36, sex: "m", job: "engineer — your brother", work: "fabriek", home: "lychener", traits: ["rias", "klager"], dis: 15, loyal: 40, family: true },
  { id: "pohl", fn: "Erich", ln: "Pohl", age: 67, sex: "m", job: "retired railwayman — your neighbour", work: null, home: "kollwitz", traits: ["loyaal"], dis: 0, loyal: 95, secretIM: true },
  { id: "micha", fn: "Micha", ln: "Seidel", age: 19, sex: "m", job: "apprentice welder, punk", work: "fabriek", home: "dimi", traits: ["punk", "vrede", "vlucht"], dis: 40, loyal: 5 },
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
export const INCIDENTS = [   // from = earliest year in which it fits
  { t: "An anonymous leaflet", d: "‘We don't want a country where you have to fear your own neighbours.’ Found in letterboxes.", from: 1983 },
  { t: "Slogans on a wall", d: "Painted in white on a facade: ‘GORBI GORBI’. Next to it a typed note with Article 27 of the constitution: freedom of expression.", from: 1987 },
  { t: "A typed call", d: "A call to come to Alexanderplatz on the 7th of the month, against the rigged election result.", from: 1989 },
  { t: "A samizdat sheet", d: "Six typed pages, ‘Umweltblätter’, about the air pollution in Bitterfeld.", from: 1987 },
  { t: "An open letter", d: "A letter to the Volkskammer about freedom to travel, asking readers to retype it and pass it on.", from: 1983 },
  { t: "A mocking poem", d: "A typed poem about ‘an old man in a hat who cannot see the future’.", from: 1983 },
  { t: "A stencil about peace", d: "A stencilled sheet with a drawing of a smith reforging a sword, and the words ‘Schwerter zu Pflugscharen’.", from: 1983 },
];

// Afgeluisterde fragmenten per trait (Wanze / telefoontap)
export const OVERHEARD = {
  rias: ["‘Did you see the ARD news last night?’", "‘Turn it up, it's the RIAS chart show.’"],
  westfam: ["‘Aunt Gerda is sending another parcel from Cologne.’", "‘My brother in Hamburg has a new Golf.’"],
  kerk: ["‘We'll stay on a bit after Sunday's service.’"],
  ausreise: ["‘If we hand in the form, we'll both lose our jobs.’"],
  affaire: ["‘My husband's home late on Tuesday, come then.’", "‘Nobody can know about us.’"],
  schulden: ["‘I can't pay him back this month.’"],
  zwart: ["‘Five West for a bottle, yes or no?’"],
  drank: ["(sound of bottles) ‘One more, then.’"],
  kindstudie: ["‘If he gets into the EOS, he can study medicine later.’"],
  milieu: ["‘The readings in the Pleiße are even worse than last year.’"],
  vrede: ["‘They want me to take the badge off my jacket. I won't.’"],
  samizdat: ["‘I made twenty carbon copies, the machine won't take more.’"],
  vlucht: ["‘Through Hungary, they say. Across the lake.’"],
  punk: ["‘They're playing in the church on Saturday, don't tell anyone.’"],
  loyaal: ["‘The Party knows what it's doing. End of.’"],
  klager: ["‘I'm writing another Eingabe about the heating. Third time.’"],
  tw: ["(the clatter of a typewriter, for a long time)", "‘The ribbon's nearly gone, and the ‘e’ is crooked again.’"],
};
