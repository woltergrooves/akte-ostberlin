// ===================== META: onderscheidingen, archief, startmodifiers (over runs heen) =====================
const K = { medals: "akte-medals-v1", ends: "akte-endings-v2" };
const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

export const MEDALS = {
  treue: { t: "Medaille für Treue Dienste", d: "Served until November 1989.", col: "#b8823a" },
  major: { t: "Kampforden", d: "Reached the rank of Major.", col: "#c42a1f" },
  kartei: { t: "Ehrennadel der Kartei", d: "Five complete files in one game.", col: "#2f6a1c" },
  faden: { t: "Roter Faden", d: "Twelve connections on the pinboard in one game.", col: "#8e1b13" },
  spuer: { t: "Spürnase", d: "Five cases solved with the right culprit.", col: "#1f4f86" },
  netz: { t: "Netzwerker", d: "Six informers at the same time.", col: "#3a6db0" },
  rein: { t: "Saubere Hände", d: "Reached the end with a conscience of 70 or more.", col: "#e6dcc0" },
  schweig: { t: "Wer hört mit?", d: "Found the bugs in your own flat.", col: "#5f6a5e" },
  helfer: { t: "Hilfsbereit", d: "Did four favours for residents in one game.", col: "#7a8f3a" },
  daily: { t: "Tagesbefehl", d: "Solved a Daily Akte.", col: "#d8b23e" },
};
export function medals() { return get(K.medals, []); }
export function award(id) { const m = medals(); if (MEDALS[id] && !m.includes(id)) { m.push(id); put(K.medals, m); return true; } return false; }

// Archiefstukken: elk gevonden einde opent er één (echte geschiedenis, kort)
export const ARCHIVE = [
  ["Directive 1/76", "In January 1976 the Ministry laid down in its Directive 1/76 what ‘Zersetzung’ meant: the systematic undermining of a person's reputation, self-confidence and relationships, so that no arrest was needed."],
  ["The Hausbuch", "Every block of flats had a Hausbuch, kept by a resident. Visitors who stayed for several days had to be entered in it. The police could ask to see it at any time, and so could the Ministry."],
  ["About 189,000", "At the end of 1989 the Ministry ran roughly 189,000 unofficial informers, alongside some 91,000 full-time staff. One informer for every ninety or so adults."],
  ["Konspirative Wohnungen", "The Ministry met its informers in thousands of ‘conspiratorial flats’: ordinary flats in ordinary buildings, rented or borrowed, with a coffee table and two armchairs."],
  ["Bornholmer Straße", "On the evening of 9 November 1989 the crowd at the Bornholmer Straße crossing grew by the minute. At about half past eleven the officer in charge gave the order to open the barrier."],
  ["15 January 1990", "Citizens forced their way into the Ministry headquarters on Normannenstraße. In the months before, offices across the country had already been occupied to stop the shredding."],
  ["The Stasi Records Act", "From 2 January 1992 anyone could ask to read the file the Ministry had kept on them. More than three million people have done so."],
  ["The torn files", "Thousands of sacks of torn paper were found. Since the 1990s, archivists have been fitting the scraps back together, page by page."],
];

export const MODS = {
  kessler: { t: "Strenger Kessler", d: "Annual targets one result higher. A failed assessment hurts twice as much.", need: 1 },
  leine: { t: "Kurze Leine", d: "One less manpower every turn.", need: 2 },
  hase: { t: "Alter Hase", d: "Start as Oberleutnant. Kessler expects one extra informer every year.", need: 3 },
};
export function endingsFound() { return get(K.ends, []); }
export function unlockedMods() { const n = endingsFound().length; return Object.keys(MODS).filter(k => MODS[k].need <= n); }
