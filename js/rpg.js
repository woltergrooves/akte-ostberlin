// ===================== RPG (fase 3E): ervaring, vaardigheden, reputatie, gunsten, verhoor =====================
// Pure gegevens en hulpfuncties; game.js koppelt ze aan de spelstaat.

export const SKILLS = {
  obs: { t: "Observation", short: "OBS", d: "More traits per observation. Gossip you pick up is more often true." },
  verh: { t: "Interrogation", short: "VER", d: "More time and more room for mistakes in an interrogation. Warnings frighten more. Treff questioning works better." },
  ueb: { t: "Persuasion", short: "ÜBZ", d: "Better odds when you recruit an informer and in every conversation." },
  tech: { t: "Technique", short: "TEC", d: "Your bugs are found less often and post checks leave fewer traces. Level 3: one extra bugging set." },
  geh: { t: "Secrecy", short: "GEH", d: "Suspicion against you rises more slowly. Anonymous calls and favours are safer." },
};
export const SK_MAX = 5;
export const XP_PER_POINT = 40;          // elke 40 ervaringspunten: één vaardigheidspunt
export const XP = { observe: 2, trait: 1, post: 2, link: 3, complete: 10, report: 1, solved: 15, wrong: 6, recruit: 8, arrest: 6, zers: 6, quest: 10, verhoor: 6, talk: 2, review: 25 };

// Reputatie: MfS = Favour (gunst), gezin = Family; nieuw: buurt en kerk
export const REP = {
  mfs: { t: "Ministry", d: "Kessler and Normannenstraße. Same as Favour." },
  buurt: { t: "District", d: "How the neighbours see you. Low: people stop talking to you. High: they come to you with favours." },
  kerk: { t: "Church", d: "Pastor Kühn's congregation. Low: churchgoers close ranks. High: they let things slip, and some of them will speak for you later." },
  gezin: { t: "Family", d: "Katrin and Jens. Same as the family meter." },
};
export const repWord = v => v >= 75 ? "trusted" : v >= 55 ? "respected" : v >= 35 ? "wary" : v >= 15 ? "cold" : "hostile";

// Gunsten die bewoners vragen (bijmissies). need: wat je moet geven; mp: mankracht; e: effect op meters
export const ERRANDS = {
  kaffee: { t: "Real coffee", ask: "‘My mother turns seventy on Sunday. If only I could find real coffee somewhere. Jacobs, not Rondo.’", need: "kaffee", done: "You hand over the packet in a Konsum bag. For a moment there is nothing between you but the smell of it." },
  buck: { t: "Something special", ask: "‘The children have never seen a pineapple. Not once. Can you imagine?’", need: "buck", done: "The tin disappears into a string bag. ‘You didn't get this from me,’ you say. They laugh. You don't." },
  roof: { t: "The leaking roof", ask: "‘The roof has been leaking for two winters. The KWV says next year. They said that last year.’", mp: 1, e: { g: -1 }, done: "One call from your office to the Kommunale Wohnungsverwaltung. A roofer appears on Thursday. Nobody asks why." },
  eos: { t: "A place at the EOS", ask: "‘My boy has the grades for the EOS. But they say his father is not reliable enough.’", trait: "kindstudie", mp: 1, e: { g: -2 }, done: "You have a word with the school director. The letter of acceptance arrives a week later. So does the gratitude." },
  parts: { t: "Trabant parts", ask: "‘A clutch cable for a 601. Twelve years on the list for a car, and now this.’", need: "dm", done: "Fifty Westmarks buy a clutch cable from the Intershop's back door. You pass it on without a word." },
  letter: { t: "The lost letters", ask: "‘My brother writes from Hamburg every month. For half a year nothing has arrived.’", trait: "westfam", mp: 1, e: { c: 2, d: 2 }, done: "You pull the letters from a box in Abteilung M and let them go through. It is noted that someone asked." },
};
export function errandFor(p, rnd) {
  const ok = Object.keys(ERRANDS).filter(k => !ERRANDS[k].trait || p.traits.includes(ERRANDS[k].trait));
  return ok[Math.floor(rnd() * ok.length)];
}

// ---------- verhoor: zoek de tegenstrijdigheid ----------
// Interne tegenstrijdigheden: [bewering, tegenbewering]
const PAIRS = [
  ["I was at home all of Tuesday evening.", "On Tuesday I left Café Mosaik around ten, when they closed."],
  ["I came straight home after work. Six o'clock.", "I always take the last tram after the late shift. You can ask the driver."],
  ["I hardly know {N}. We nod on the stairs, that's all.", "{N} and I take the tram to the Müggelsee together every Sunday."],
  ["I haven't set foot in a church since my confirmation.", "Pastor Kühn said the same thing to me last week, after the service."],
  ["We only watch our own channels. The Aktuelle Kamera.", "That song? It was on RIAS on Sunday. Everybody heard it."],
  ["I don't own a typewriter. I never have.", "I buy the ribbons at the stationer's on Schönhauser Allee, like everybody."],
];
// Tegenstrijdig met het dossier (alleen als dat kenmerk bevestigd is)
export const DENIALS = {
  westfam: "I have no relatives in the West. None at all.",
  ausreise: "Leave the Republic? I have never even thought about it.",
  kerk: "Church? I have no time for that.",
  rias: "Western radio? Not in our house.",
  samizdat: "I don't read anything that isn't in the shops.",
  drank: "I hardly drink. A beer at a birthday, that's all.",
  schulden: "Money has never been a problem for us.",
  affaire: "I spend every evening with my family.",
  punk: "That music? I've never been to a concert like that.",
  zwart: "I have never held a Westmark in my hand.",
  milieu: "The environment? That is for the experts.",
  vlucht: "Hungary is just a holiday country to me. Lake Balaton, nothing else.",
};
const FILLER = [
  "I queued at the Kaufhalle for bananas. They were gone by the time I got to the front.",
  "I read the Neues Deutschland and went to bed early.",
  "The stove was out again, so I went down to the cellar for coal.",
  "I work, I pay my rent, I don't cause any trouble.",
  "On Wednesday there was the Hausgemeinschaft meeting. I took minutes.",
  "My sister visited from Cottbus. It is in the Hausbuch.",
  "I watched the football. Dynamo won again, of course.",
  "I fixed my neighbour's bicycle in the courtyard.",
];
// Bouwt een verhaal van 5 regels met precies één leugen. Geeft { lines, lie, why, file } terug.
export function buildStory(p, known, neighbour, rnd) {
  const pick = a => a[Math.floor(rnd() * a.length)];
  const fileT = known.filter(t => DENIALS[t]);
  const fillers = [...FILLER].sort(() => rnd() - 0.5);
  let lines, lie, why, file = null;
  if (fileT.length && rnd() < 0.55) {
    const t = pick(fileT); file = t;
    lines = fillers.slice(0, 4); lie = Math.floor(rnd() * 5); lines.splice(lie, 0, DENIALS[t]);
    why = "file";
  } else {
    const [a, b] = pick(PAIRS).map(s => s.replace(/\{N\}/g, neighbour || "my neighbour"));
    lines = fillers.slice(0, 3); const ia = Math.floor(rnd() * 2); lines.splice(ia, 0, a);
    lie = ia + 1 + Math.floor(rnd() * (4 - ia)); lines.splice(lie, 0, b);
    why = ia;   // index van de bewering waarmee de leugen botst
  }
  return { lines, lie, why, file };
}
