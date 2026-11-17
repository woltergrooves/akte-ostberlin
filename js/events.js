// ===================== STORY: fixed and conditional events (English) =====================
import { TURNS } from "./data.js";
const free = q => q.status === "vrij" || q.status === "zersetzt";
// e: g=favour c=conscience o=unrest d=own file (suspicion) fam=family fu=rivalry Fuchs res=results mk=manpower next turn (negative = less)

export const STORY = {
  // ---------------- 1983 ----------------
  "1983-mrt": [{
    id: "intro", via: "telefoon", title: "Welcome to the Kreisdienststelle", who: "Major Horst Kessler — your chief",
    text: "‘Leutnant. Your desk, your district: Prenzlauer Berg. Artists, pastors, complainers. I want to know what they think before they know it themselves.\n\nYou have limited manpower each turn. Use it in the district: observe, bug, recruit informers. At the end of every year I assess you on results and on your network of IMs.\n\nAnd Leutnant — everyone is being watched. Us too.’",
    choices: [{ t: "‘Jawohl, Genosse Major.’", d: "The line clicks.", e: {}, r: "You put the receiver down. There is already a stack of files on your desk. Tap the map on the wall to look at the district." }]
  }],
  "1983-jun": [{
    id: "brandt", via: "dossier", person: "brandt", title: "The grumbling mechanic", who: "Dieter Brandt, 34, car mechanic — VEB Bergmann-Borsig",
    src: "IM „Rose“", text: "Brandt tells jokes about the General Secretary in the canteen. Listens to RIAS in the evenings. Said: ‘In ten years none of this will be left.’ Otherwise: good at his job, popular with colleagues.",
    choices: [
      { t: "File it away", d: "Jokes are not a crime.", e: { g: -4, c: 2 }, flag: "brandtSpared", r: "You put the report at the bottom of the pile. Kessler frowns when he sees the empty column.", fate: ["brandt", "Read his file in 1992: three pages, then nothing. ‘Someone let me go,’ he said."] },
      { t: "Warning interview", d: "Give him a fright. Small, effective.", e: { g: 3, c: -4, o: -1 }, flag: "brandtWarned", fx: (S, A) => { A.p("brandt").dis -= 10; A.p("brandt").fear += 30; }, r: "Two men in leather coats wait for Brandt at the factory gate. He stops telling jokes.", fate: ["brandt", "Stayed a mechanic. Only told his children about the ‘conversation’ after 1990. Slept badly for years."] },
      { t: "Open an operational case", d: "Full surveillance. Phone, post, colleagues.", e: { g: 8, c: -9, res: 1 }, flag: "brandtOV", fx: (S, A) => { A.pages("brandt", 40); A.know("brandt", "drank"); A.know("brandt", "rias"); }, r: "A new file: OV „Schraube“. Kessler nods his approval.", fate: ["brandt", "Lost his job in 1985 for no stated reason. In 1992 he found his best friend's name in his file, as an informer."] },
    ]
  }],
  "1983-sep": [{
    id: "embleem", via: "dossier", person: "richter", title: "The badge", who: "Klaus Richter, 45, history teacher — EOS Carl von Ossietzky",
    src: "School management", text: "Three pupils wear the ‘Schwerter zu Pflugscharen’ badge on their jackets. The head has told them to take it off. In the staff room Richter said: ‘A Bible verse is no threat to the state.’\n\nOn 24 September, at the church congress in Wittenberg, a sword was reforged into a ploughshare. A Western camera crew filmed it.",
    choices: [
      { t: "Leave it to the school", d: "A badge is a badge.", e: { g: -3, c: 2 }, r: "The pupils cut the badge off their jackets. A pale circle stays behind in the fabric. Everyone knows what was there." },
      { t: "Summon pupils and parents", d: "A meeting at school, with you present.", e: { g: 5, c: -6 }, fx: (S, A) => { A.pages("richter", 8); }, r: "Two pupils promise to do better. The third points out that the statue was a gift from the Soviet Union to the United Nations. That is true. Which makes the meeting even longer." },
      { t: "Put a note on Richter's record", d: "‘Ideologically unreliable.’", e: { g: 7, c: -8, res: 1 }, fx: (S, A) => { A.pages("richter", 25); A.know("richter", "kerk"); A.log("richter", "Note: ideologically unreliable (1983)"); }, r: "Richter may no longer teach the final-year classes. He says nothing about it. From now on he wears a tie." },
    ]
  }],
  "1983-dec": [{
    id: "frauen", tease: "Kessler at the door, coat already on: ‘First thing tomorrow, Leutnant. It's about women. And peace.’", via: "telefoon", person: "jutta", title: "Frauen für den Frieden", who: "Major Kessler",
    text: "‘Bohley and Poppe of the group Frauen für den Frieden were arrested today. Contacts with Western peace activists. Someone in your district mixes with those women: Jutta Lang, architect, Kollwitzstraße. I want to know what she is doing.’",
    choices: [
      { t: "Have Lang followed", d: "Three weeks, day and night.", e: { g: 5, c: -4 }, fx: (S, A) => { A.pages("jutta", 15); A.know("jutta", "samizdat"); }, r: "Lang goes to work, to a church in Friedrichshain and home. And she types. Every evening, until late." },
      { t: "A warning interview", d: "Let her know you are watching.", e: { g: 3, c: -2, o: -1 }, fx: (S, A) => { A.p("jutta").fear += 20; }, r: "Lang listens and nods. ‘I design nurseries, Leutnant. What exactly are you afraid of?’" },
      { t: "‘She has nothing to do with it’", d: "Keep her out of the investigation.", e: { g: -4, c: 4, d: 3 }, r: "Kessler writes it down. ‘We shall see.’ After protests at home and abroad, both women are released six weeks later." },
    ]
  }],
  // ---------------- 1984 ----------------
  "1984-mrt": [{
    id: "anna", tease: "The passport office phones just before five: ‘We have an application here from your district. A medical student.’", via: "dossier", person: "anna", title: "A ticket to Hamburg", who: "Anna Weiss, 22, medical student",
    src: "Passport office", text: "Weiss has filed an Ausreiseantrag, an application to leave. Her fiancé lives in Hamburg. Since January the authorities have suddenly been letting thousands of applicants go, day after day; everyone in the district knows. Excellent grades. No known political activity.",
    choices: [
      { t: "Pass the application on", d: "Let the system take its course.", e: { g: -5, c: 5 }, flag: "annaPassed", fx: (S, A) => { A.later(9, "anna-leave"); }, r: "Your stamp is on it. In a year or two she might be allowed to go.", fate: ["anna", "Left for Hamburg in 1986. Became a paediatrician."] },
      { t: "Have her place withdrawn", d: "Applicants don't deserve privileges.", e: { g: 6, c: -10, o: 1 }, fx: (S, A) => { A.p("anna").job = "laundry worker"; A.pages("anna", 20); }, r: "The university strikes her off. She now works in a laundry.", fate: ["anna", "Was only allowed to leave in 1989. Started her studies again at 28."] },
      { t: "Recruit her as IM „Möwe“", d: "A faster exit... if she reports on fellow students.", e: { g: 7, c: -12 }, flag: "annaIM", fx: (S, A) => { A.makeIM("anna", "Möwe"); }, r: "She cries in the interview room, and signs.", fate: ["anna", "Reported on friends for four years. Left in 1988. Could not bear to see her own codename in other people's files."] },
    ]
  }],
  "1984-jun": [{
    id: "vertretung", via: "telefoon", person: "herta", title: "The Permanent Mission", who: "Major Kessler",
    text: "‘East Germans are sitting in Bonn's Permanent Mission on Hannoversche Straße, trying to force their way out. Bonn has closed the building to visitors. One of them is the brother-in-law of Herta Schulz, the caretaker in Greifswalder Straße. A loyal woman. Her son wants to go to university.’",
    choices: [
      { t: "Have Herta phone him", d: "She asks her brother-in-law to come out.", e: { g: 5, c: -6 }, fx: (S, A) => { A.p("herta").fear += 15; A.log("herta", "Had to phone her brother-in-law in the Permanent Mission (June 1984)"); }, r: "Herta phones, in tears. Her brother-in-law does not come out. But she phoned, and that goes in her file, in the column marked ‘reliable’." },
      { t: "Recruit her as IM „Besen“", d: "Her son gets his place. If she cooperates.", e: { g: 7, c: -9 }, flag: "hertaIM", fx: (S, A) => { A.makeIM("herta", "Besen"); }, r: "Herta signs without reading. ‘As long as my boy can study.’", fate: ["herta", "Was IM „Besen“ for five years. Her son became a doctor. She never told him why it was so easy."] },
      { t: "Leave Herta out of it", d: "It's not her doing.", e: { g: -3, c: 3 }, r: "The Mission only reopens at the end of July. You never hear what became of the brother-in-law. Herta sweeps the stairwell, as always." },
    ]
  }],
  "1984-sep": [{
    id: "kuehn", via: "dossier", person: "kuehn", title: "The cellar under the church", who: "Pastor Martin Kühn — Zionskirche",
    src: "IM „Orgel“", text: "A peace circle meets every week in the cellar of the parish hall: young people, a few conscientious objectors, ‘Schwerter zu Pflugscharen’ badges. A stencil duplicator is in use. Kühn says: ‘The church is there for everyone.’",
    choices: [
      { t: "Let it be", d: "It's a church. Too sensitive.", e: { g: -8, c: 3, o: 3, d: 4 }, r: "‘Let it be?’ Kessler gives you a long look. ‘We'll talk about this again, comrade.’", fate: ["kuehn", "In 1986 his cellar became the Umwelt-Bibliothek, a meeting place for the whole opposition."] },
      { t: "Infiltrate an IM", d: "One of ours in the group. (+1 IM)", e: { g: 7, c: -5 }, fx: (S, A) => A.spawnIM("Orgel-2", "kerk"), r: "A young volunteer turns up in the cellar. He is yours.", fate: ["kuehn", "Discovered in 1992 that his most loyal volunteer worked for the Stasi. They never spoke again."] },
      { t: "Zersetzung", d: "Rumours of an affair. Letters to his wife.", e: { g: 11, c: -16, res: 1 }, flag: "kuehnZers", fx: (S, A) => { A.p("kuehn").dis -= 20; A.pages("kuehn", 60); A.log("kuehn", "Zersetzung: anonymous letters"); }, r: "Anonymous letters reach the rectory. His marriage starts to crack. Nobody knows where it is coming from.", fate: ["kuehn", "His marriage did not survive. Only in 1992 did he read that the letters were written by the Ministry."] },
    ]
  }],
  // ---------------- 1985 ----------------
  "1985-mrt": [{
    id: "gorbi", via: "telefoon", title: "A new man in Moscow", who: "Major Kessler",
    text: "‘Chernenko is dead. Moscow has a new General Secretary: Gorbachev, fifty-four. In the canteens they say things will change now. Nothing will change here, Leutnant. I want to know who says it out loud.’",
    choices: [
      { t: "A list of the hopeful", d: "Your IMs supply names.", e: { g: 5, c: -4 }, fx: (S, A) => { A.people().filter(p => p.status === "vrij" && p.traits.includes("rias")).slice(0, 5).forEach(p => A.pages(p.id, 3)); }, r: "There are more names than you expected. Mostly very ordinary people." },
      { t: "‘Nobody, Genosse Major.’", d: "Hope is not a crime yet.", e: { g: -2, c: 2 }, r: "Kessler grunts. On his secretary's desk lies a Neues Deutschland with a large photo of the new man. She has cut it out." },
    ]
  }],
  "1985-jun": [{
    id: "lena", via: "dossier", person: "lena", title: "A letter to the West", who: "Lena Vogt, 41, nurse — Poliklinik",
    src: "Postal control, Abteilung M", text: "Intercepted letter to her sister in Cologne: ‘We have no insulin left on the ward. The doctors are ashamed.’ Letter confiscated.",
    choices: [
      { t: "Let the letter go through", d: "She is only telling the truth.", e: { g: -6, c: 7, d: 5 }, flag: "lenaLet", r: "A week later the letter is in Cologne. Nobody notices, you think.", fate: ["lena", "Her sister sent medicine in parcels for years. Some of them arrived."] },
      { t: "Destroy the letter, nothing more", d: "Problem solved.", e: { g: 2, c: -2 }, r: "The letter disappears. Lena wonders why her sister never writes back.", fate: ["lena", "Thought for years that her sister was ignoring her."] },
      { t: "Disciplinary proceedings", d: "‘Spreading slander against the state.’", e: { g: 8, c: -12, res: 1 }, fx: (S, A) => { A.pages("lena", 45); A.p("lena").job = "night nurse, old people's home"; }, r: "Lena is transferred to night shifts in an old people's home outside the city.", fate: ["lena", "Returned to the Poliklinik in 1991. Her file ran to 89 pages."] },
    ]
  }],
  "1985-sep": [{
    id: "thomas", tease: "IM „Kranich“ asks for an urgent Treff. ‘It's about someone you know.’", via: "dossier", person: "thomas", title: "A name you know", who: "Thomas — your brother, engineer at VEB Bergmann-Borsig",
    src: "IM „Kranich“", text: "Engineer T. spoke at lunch about ‘those old men in the Politbüro’ and said he has ‘had enough’. Requesting further instructions.", note: "You read it twice. It's your brother.",
    choices: [
      { t: "Make the report disappear", d: "Nobody needs to know.", e: { c: 4, d: 8 }, flag: "cover", r: "The report goes through the shredder. Your hands shake a little.", fate: ["thomas", "Never knew how much danger he was in. Only heard it from you in 1992."] },
      { t: "Warn him yourself", d: "An evening walk along the Spree.", e: { c: 6, d: 4, fam: 5 }, flag: "warn", fx: (S, A) => { A.p("thomas").dis -= 10; }, r: "‘Keep your mouth shut at work,’ you say. Thomas looks at you as if he is seeing you for the first time.", fate: ["thomas", "Understood that evening what his brother did. For years they only spoke on birthdays."] },
      { t: "Pass it on to Kessler", d: "No exceptions. Not even for family.", e: { g: 12, c: -22, fam: -15, res: 1 }, flag: "betray", fx: (S, A) => { A.pages("thomas", 30); A.p("thomas").job = "engineer — transferred to Bitterfeld"; }, r: "Kessler claps you on the shoulder. ‘That is a Chekist.’ Thomas is transferred to a chemical plant in Bitterfeld.", fate: ["thomas", "Read in 1992 who had passed on his report. He never spoke to you again."] },
    ]
  }],
  "1985-dec": [{
    id: "jens", via: "gezin", title: "‘What do you actually do?’", who: "Jens, your son, 10",
    text: "At dinner: ‘Dad, in class we had to say what our parents do. I didn't know. What do you actually do?’",
    choices: [
      { t: "‘I work for the Ministry of the Interior.’", d: "A safe lie.", e: { fam: 0, c: -1 }, r: "Jens nods. Katrin looks at her plate." },
      { t: "‘I protect our country from its enemies.’", d: "Proud. And true, isn't it?", e: { fam: 4, c: -3 }, r: "Jens's eyes go wide. The next day he tells the whole school. You get a note about it from the department.", fx: (S, A) => { S.dossier += 3; } },
      { t: "‘I'm not allowed to say, son.’", d: "Honest, in a way.", e: { fam: -4, c: 2 }, r: "‘So it's a secret?’ Jens thinks that's exciting. You think it's something else." },
    ]
  }],
  // ---------------- 1986 ----------------
  "1986-mei": [{
    id: "tsjernobyl", tease: "On RIAS, a Swedish power station is measuring radiation that does not come from Sweden.", via: "telefoon", title: "Chernobyl", who: "Major Kessler",
    text: "‘Neues Deutschland printed a short TASS report about an ‘accident’ in Ukraine. At the Poliklinik, doctors are telling patients not to eat lettuce and to keep children indoors. Western propaganda. I want it stopped.’",
    choices: [
      { t: "Intimidate the doctors", d: "Interviews with the whole team.", e: { g: 6, c: -10, o: -3 }, fx: (S, A) => A.workers("kliniek").forEach(p => { p.fear += 20; A.pages(p.id, 5); }), r: "The doctors fall silent. Local vegetables, which the West no longer wants to buy, are cheap in the Kaufhalle." },
      { t: "Just make a note", d: "You keep your own child indoors.", e: { g: -2, c: 3, o: 3, fam: 4 }, r: "You write a short report. At home you tell Katrin that Jens must play indoors for a week. She asks why. You don't answer." },
      { t: "Go after Lena Vogt", d: "She complained the loudest.", e: { g: 4, c: -6 }, fx: (S, A) => { A.pages("lena", 15); A.know("lena", "klager"); A.log("lena", "Questioned about ‘scaremongering’ (Chernobyl)"); }, r: "Vogt is questioned for an afternoon. All she says is: ‘I have children too, Leutnant.’" },
    ]
  }],
  "1986-meib": [{
    id: "balaton", via: "gezin", title: "Lake Balaton", who: "Katrin, your wife",
    text: "‘My sister has got us a spot at a campsite on Lake Balaton. Two weeks, in August. Jens talks about nothing else. You're coming, aren't you?’",
    choices: [
      { t: "Go on holiday", d: "2 less manpower next turn.", e: { fam: 18, g: -3, mk: -2 }, r: "In Hungary you see West German families in Mercedes cars. Jens stares at them. So do you, when nobody is looking." },
      { t: "Work comes first", d: "They go without you.", e: { fam: -12, g: 4 }, r: "Katrin says nothing. Jens sends a postcard addressed to ‘Mum and Dad’, but only Mum is in the picture." },
    ]
  }],
  "1986-sep": [{
    id: "umweltbib", via: "dossier", person: "kuehn", title: "A library in the cellar", who: "Zion parish, Prenzlauer Berg",
    src: "IM reporting", text: "Since 2 September an ‘Umwelt-Bibliothek’ has been running in the cellar of the parish hall at the Zionskirche: books on the environment, peace and human rights, talks, an exhibition. Pastor Kühn helped. There is talk of a newsletter of their own.",
    choices: [
      { t: "Let it run, note everything", d: "An open cellar is an open book.", e: { g: 3, c: -2 }, fx: (S, A) => A.workers("kerk").forEach(p => A.pages(p.id, 4)), r: "You put two men on the door. Within a month you have sixty names. Including people who only came to borrow a book about trees." },
      { t: "Lean on the church leadership", d: "A word with the Konsistorium.", e: { g: 6, c: -5, o: 2 }, r: "The church leadership promises ‘talks’. The pastor promises nothing. The library stays open." },
      { t: "An IM as a volunteer", d: "Someone to sort the books. (+1 IM)", e: { g: 6, c: -6 }, fx: (S, A) => A.spawnIM("Buchwurm", "kerk"), r: "A student offers to sort books. He sorts names too." },
    ]
  }],
  // ---------------- 1987 ----------------
  "1987-mrt": [{
    id: "fuchs", tease: "In the canteen they say a young Oberleutnant from Potsdam-Eiche is coming to your department.", via: "telefoon", title: "A new colleague", who: "Major Kessler and Oberleutnant Fuchs",
    text: "Kessler introduces Oberleutnant Rüdiger Fuchs: young, ambitious, just back from the college in Potsdam-Eiche. ‘Fuchs will take Greifswalder Straße off your hands, unless you show me you need him.’\n\nFuchs smiles. ‘We can work together. You share your IMs with me, I share my successes.’",
    choices: [
      { t: "Work together", d: "He gets access to your network.", e: { g: -2, fu: -20 }, r: "Fuchs is charming. You are not quite sure what he does with your information.", flag: "fuchsAlly" },
      { t: "Politely decline", d: "Your district is yours.", e: { fu: 15 }, r: "‘Of course,’ says Fuchs. ‘I completely understand.’ He writes something down." },
      { t: "Put him in his place", d: "‘I've been here four years, Oberleutnant.’", e: { g: 3, fu: 35 }, r: "Kessler laughs. Fuchs does not." },
    ]
  }],
  "1987-jun": [{
    id: "mauerkonzert", tease: "Kessler: ‘The West is putting on a concert right by the Wall. Loudspeakers pointing east. Keep your weekend free.’", via: "telefoon", person: "micha", title: "‘Die Mauer muss weg!’", who: "Volkspolizei, Unter den Linden",
    text: "From 6 to 8 June, Western bands played right by the Reichstag: Bowie, Eurythmics, Genesis. Hundreds of young East Berliners listened on this side of the Wall and chanted ‘Die Mauer muss weg!’ — the Wall must go. The Vopo arrested dozens. One of them lives in your district: Micha Seidel, 19, apprentice welder.",
    choices: [
      { t: "Have him released", d: "A stupid boy. He has learned his lesson.", e: { g: -4, c: 5 }, flag: "michaFree", r: "Micha walks out of the cell. He does not look back.", fate: ["micha", "Became a welder in West Berlin in 1990. He never found out who let him go."] },
      { t: "Recruit him", d: "Punks know punks. (+1 IM)", e: { g: 6, c: -9 }, fx: (S, A) => A.makeIM("micha", "Gitarre"), r: "After three sleepless nights he signs. ‘Can I go home now?’", fate: ["micha", "Reported on his own band. Stopped in 1989; his friends found it in the files in 1993."] },
      { t: "Charge him with ‘rowdyism’", d: "§215. An example to others.", e: { g: 9, c: -12, o: -2, res: 1 }, fx: (S, A) => A.setStatus("micha", "gevangen"), r: "Micha gets ten months. At his workplace the foreman puts up a warning.", fate: ["micha", "Served ten months. Was bought free by West Germany in 1989."] },
    ]
  }],
  "1987-sep": [{
    id: "palme", via: "telefoon", title: "Honecker in Bonn", who: "Major Kessler",
    text: "‘From 7 to 11 September the General Secretary is visiting the Federal Republic. At the same time the Olof Palme peace march is crossing our country, and church groups are walking in it too. Permitted, Leutnant. Not welcome. No pictures the West can use.’",
    choices: [
      { t: "Keep familiar faces at home", d: "A week of ‘visitors’ for the most restless.", e: { g: 6, c: -6, o: 1 }, fx: (S, A) => { A.people().filter(p => p.status === "vrij" && p.dis > 45).slice(0, 3).forEach(p => { A.pages(p.id, 5); A.log(p.id, "‘Accompanied’ for a week during the Palme march (Sept. 1987)"); }); }, r: "Three people in your district get a week of visits from ‘friends’ who don't leave. None of them appears in the footage of the march." },
      { t: "Let them march, take photos", d: "See who turns up.", e: { g: 2, c: -1 }, fx: (S, A) => { A.people().filter(p => p.traits.includes("vrede")).forEach(p => A.know(p.id, "vrede")); }, r: "The march passes quietly. One banner says ‘Schwerter zu Pflugscharen’. Nobody intervenes. Your photographers shoot three rolls of film." },
      { t: "Go and look yourself", d: "Off duty, in plain clothes.", e: { c: 4, fam: 3, g: -2 }, r: "You walk a stretch with your hat pulled low. A woman hands you a candle. You are not sure what to do with it." },
    ]
  }],
  "1987-okt": [{
    id: "skins", via: "telefoon", person: "micha", title: "Saturday night at the Zionskirche", who: "Volkspolizei-Inspektion Mitte",
    text: "17 October, after a concert in the Zionskirche: around thirty skinheads storm the church, shouting Nazi slogans and beating concert-goers. Micha Seidel, the punk from Dimitroffstraße, is in the Poliklinik with a broken nose. The Vopo want to know how the report should read.",
    choices: [
      { t: "‘Rowdies on both sides’", d: "Officially there are no Nazis in the GDR.", e: { g: 5, c: -8 }, fx: (S, A) => { A.pages("micha", 10); A.log("micha", "Named as a ‘rowdy’ in the Zionskirche report"); }, r: "The report mentions punks and skinheads in the same sentence. Micha never reads it. But at the next check it is him they search, not them." },
      { t: "An honest report", d: "Skinheads, organised, with slogans.", e: { g: -3, c: 6, d: 3 }, r: "Your report goes upstairs. At the end of November four skinheads stand trial. The sentences are so light that there are protests, even inside the Party. On appeal they go up." },
      { t: "Visit Micha in the clinic", d: "With oranges from the Delikat shop.", e: { g: 3, c: -2 }, fx: (S, A) => { A.know("micha", "punk"); A.p("micha").loyal += 10; }, r: "‘Why are you being so nice?’ Micha asks. He eats the oranges. And tells you who plays in his band." },
    ]
  }],
  "1987-nov": [{
    id: "inval", tease: "Kessler, on the stairs: ‘Keep tomorrow night free. Wear boots.’", via: "telefoon", title: "Operation ‚Falle‘", who: "Major Kessler — direct order",
    text: "‘Tonight we roll up the Umwelt-Bibliothek at the Zionskirche. They print their Umweltblätter there. You lead team two. Printing machines, paper, names. Understood?’",
    choices: [
      { t: "Take part, as ordered", d: "You are an officer.", e: { g: 10, c: -8, o: 4, res: 1 }, fx: (S, A) => { A.workers("kerk").forEach(p => A.pages(p.id, 10)); }, r: "At midnight you carry boxes out. The boys who were printing come with you. Outside, people stand with candles. Every evening there are more of them." },
      { t: "Leak a tip-off", d: "An anonymous call from a phone box.", e: { g: -6, c: 10, d: 14 }, flag: "leak", r: "When you arrive, the printing machine is gone. Kessler looks long and hard at everyone on the team. At you too." },
      { t: "Call in sick", d: "Someone else will do it.", e: { g: -5, c: 2, d: 4, fu: 10 }, r: "Fuchs leads your team. He gets a bonus. You lie awake all night." },
    ]
  }],
  // ---------------- 1988 ----------------
  "1988-jan": [{
    id: "llDemo", via: "telefoon", title: "Rosa Luxemburg", who: "Major Kessler",
    text: "‘On Sunday 17 January there is the annual march for Luxemburg and Liebknecht. Our intelligence says dissidents and exit applicants want to join it with a banner of their own: Freedom is always the freedom of those who think differently. A quote from Rosa herself, the nerve of it.’",
    choices: [
      { t: "Pre-emptive arrests", d: "Anyone with a file stays home on Sunday.", e: { g: 9, c: -10, o: 3, res: 1 }, fx: (S, A) => { A.people().filter(p => p.status === "vrij" && p.dis > 45).slice(0, 3).forEach(p => { A.pages(p.id, 15); A.log(p.id, "Held pre-emptively (January 1988)"); }); }, r: "Dozens of people are picked up before they can unroll the banner. West German TV shows it the same evening. In the churches in your district they pray for the arrested." },
      { t: "Just observe", d: "Let them march, take photos.", e: { g: 2, c: -2 }, fx: (S, A) => { A.people().filter(p => p.dis > 45).forEach(p => A.pages(p.id, 4)); }, r: "Your photographers shoot five rolls of film. The banners are gone within thirty seconds." },
    ]
  }],
  "1988-janb": [{
    id: "pohl", via: "gezin", title: "Your own neighbour", who: "Katrin",
    text: "Katrin at the table: ‘Herr Pohl next door asked again what time you get home in the evenings. And whether your brother still comes round. He asks every week.’\n\nPohl is 67, a retired railwayman, always friendly.",
    choices: [
      { t: "Check the card index", d: "Costs 1 manpower.", e: { mk: -1 }, flag: "pohl", r: "His card is ‘gesperrt’: blocked, not visible at your rank. Someone above you has put him on you." },
      { t: "Ignore it", d: "Old people are nosy.", e: {}, r: "You put it down to gossip. Pohl keeps greeting you warmly." },
    ]
  }],
  "1988-apr": [{
    id: "fuchs2", via: "telefoon", title: "Fuchs makes his move", who: "Oberleutnant Fuchs",
    cond: S => S.fuchs >= 30,
    text: "Fuchs is standing in your doorway. ‘I happened to notice that one of your reports never reached the archive. And that the church was warned in '87. A coincidence, of course. Or would you like to talk about it?’",
    choices: [
      { t: "Blackmail him back", d: "You know something too: he swaps West marks at the Interhotel bar.", e: { fu: -25, c: -4, d: -6 }, cond: S => S.flags.fuchsDirt, r: "Fuchs goes pale. ‘We understand each other, comrade.’ You have an enemy, but a quiet one." },
      { t: "Tell Kessler yourself", d: "Get ahead of it: admit a small mistake.", e: { g: -6, d: -4, fu: 10 }, r: "Kessler listens and says: ‘I appreciate honesty. Once.’" },
      { t: "Deny it", d: "‘I don't know what you're talking about.’", e: { d: 10, fu: 10 }, r: "Fuchs nods slowly. A week later a copy of an internal memo lands on your desk, with your name on it." },
    ]
  }],
  "1988-jul": [{
    id: "springsteen", via: "gezin", title: "Bruce in Weißensee", who: "Jens, 13",
    text: "On 19 July the FDJ is putting on a concert by an American rock star at the cycling track in Weißensee. Hundreds of thousands of people. Jens begs: ‘All the boys in my class are going! Come with me, please?’",
    choices: [
      { t: "Go with Jens", d: "1 less manpower next turn.", e: { fam: 14, mk: -1 }, r: "In the crowd, 160,000 East Germans sing along to songs about freedom and driving away. Jens sits on your shoulders. For a moment you are not an officer." },
      { t: "Work: lots of ‘elements’ there", d: "You walk around with a camera.", e: { g: 4, fam: -8 }, fx: (S, A) => A.people().filter(p => p.traits.includes("punk")).forEach(p => A.know(p.id, "punk")), r: "You photograph faces. In one of the photos, far away, is your own son." },
    ]
  }],
  "1988-nov": [{
    id: "sputnik", via: "dossier", person: "richter", title: "The banned magazine", who: "Klaus Richter, history teacher — EOS Carl von Ossietzky",
    src: "School management", text: "On 19 November the papers said the Soviet magazine Sputnik had been ‘removed from the postal subscription list’. Richter then had his class write an essay on ‘perestroika and truth’. Four pupils have put up a critical wall newspaper.",
    choices: [
      { t: "A word with the head, no more", d: "Let the school deal with it.", e: { g: -2, c: 2, o: 1 }, r: "Richter gets a reprimand. The wall newspaper is taken down.", fate: ["richter", "Taught until 2010. Former pupils called him ‘the only one who took us seriously’."] },
      { t: "Expel the pupils, sack Richter", d: "Set an example.", e: { g: 10, c: -14, o: 4, res: 1 }, fx: (S, A) => { A.p("richter").job = "warehouse worker"; A.pages("richter", 50); }, r: "Four seventeen-year-olds are barred from their final exams. Richter becomes a warehouse worker.", fate: ["richter", "One of the expelled pupils wrote a book about that week in 1990. Richter was rehabilitated in 1991."] },
      { t: "Recruit Richter", d: "A teacher sees a lot.", e: { g: 3, c: -6 }, r: "Richter refuses. He says: ‘Do what you have to do.’ You do nothing. Why not, actually?", fate: ["richter", "Read in 1992 that he had refused to sign. It was the only thing in his file he was proud of."] },
    ]
  }],
  // ---------------- 1989 ----------------
  "1989-feb": [{
    id: "gueffroy", via: "telefoon", title: "A note in the café", who: "Major Kessler",
    text: "‘On Sunday evening a border violator was shot dead at the Britzer Zweigkanal in Treptow. Twenty years old. His friend was arrested, wounded. Officially nothing happened. But now there's a note with his name in Café Mosaik, and a candle next to it. Who put it there?’",
    choices: [
      { t: "Find out who", d: "Ask your IMs in the café.", e: { g: 5, c: -6 }, fx: (S, A) => A.workers("cafe").forEach(p => A.pages(p.id, 4)), r: "Your IM gives a name: the waitress. She didn't even know him. She just thought someone had to do it." },
      { t: "Have it removed, nothing more", d: "No paper, no problem.", e: { g: 1, c: -1 }, r: "A man in plain clothes takes the note down. The next morning there is a new one. Then a third." },
      { t: "Leave it up", d: "It's a candle.", e: { g: -4, c: 5, d: 3 }, r: "The note stays up for a week. On 21 February a death notice appears in the Berliner Zeitung. His brother got it printed." },
    ]
  }],
  "1989-mei": [{
    id: "turvers", via: "dossier", title: "The counters", who: "Citizens at the polling stations — local elections",
    src: "Own observation", text: "On 7 May, citizens recounted the votes at polling stations in the district. Their count: far more no votes than the official result of 98.85% yes would suggest. They want to file a complaint.",
    choices: [
      { t: "Let them file it", d: "They have the right.", e: { g: -9, c: 6, d: 6, o: 3 }, r: "The complaint is received and disappears into a drawer. But word gets around." },
      { t: "Bring the leaders in", d: "24 hours, no charge.", e: { g: 8, c: -10, o: 6 }, r: "They come back, and they don't keep quiet. On the 7th of every month more people stand on Alexanderplatz." },
      { t: "Seize their tallies", d: "No evidence, no problem.", e: { g: 5, c: -6, o: 4 }, r: "Your team takes the notebooks. They made copies. Of course they did." },
    ]
  }],
  "1989-aug": [{
    id: "hongarije", tease: "At ten at night the doorbell rings. Three short rings: the way your brother always rang.", via: "gezin", person: "thomas", title: "Across the lake", who: "Thomas, your brother",
    cond: S => !S.flags.betray,
    text: "Thomas turns up at your door one evening, unannounced. Quietly: ‘Since May, Hungary has been tearing down the fence on the Austrian border. At a picnic near Sopron, hundreds of our people just walked across. We're going next week, in the Trabi, the whole family. I'm telling you because you're my brother.’ A pause. ‘Come with us. Katrin and Jens too.’",
    choices: [
      { t: "Let him go, say nothing", d: "You never saw him tonight.", e: { c: 8, d: 10 }, fx: (S, A) => A.setStatus("thomas", "gevlucht"), r: "Two weeks later a postcard arrives from Passau. No sender. Just: ‘Danke.’", fate: ["thomas", "Escaped via Hungary in August 1989. Built up an engineering firm in Passau."] },
      { t: "Go with your family", d: "Leave everything behind. Yourself too.", e: { fam: 20 }, flag: "fled", r: "You pack one suitcase. You leave your service pistol behind. Near Sopron you walk through a field of maize, holding Jens's hand. On the other side an Austrian farmer is waiting with tea.", fate: ["thomas", "Escaped together with his brother, the Stasi officer. They never talk about it."], end: true },
      { t: "Stop him", d: "Have the passports withdrawn. For his own good.", e: { g: 8, c: -15, fam: -15 }, fx: (S, A) => { A.pages("thomas", 20); }, flag: "betray", r: "Thomas is turned back at the Czechoslovak border. He isn't sure it was you. He suspects it.", fate: ["thomas", "Stayed in the GDR until the Wall fell. Requested his file in 1992 and found his brother in it."] },
    ]
  }],
  "1989-sep": [{
    id: "nf", via: "dossier", person: "jutta", title: "A signature", who: "Jutta Lang, architect",
    src: "IM reporting", text: "Lang has signed the appeal ‘Aufbruch 89 – Neues Forum’ and is handing out copies in Café Mosaik. On 11 September Hungary opened its border to GDR citizens; thousands are driving west. In Leipzig there are demonstrations every Monday.", note: "Everyone in the office can feel it. Something is changing.",
    choices: [
      { t: "Do nothing", d: "You can't hold back the sea.", e: { g: -6, c: 4, o: 3 }, r: "Your file on Lang stays thin. The office is too busy panicking to notice.", fate: ["jutta", "Designed a school in Pankow after the Wende."] },
      { t: "Round-the-clock surveillance", d: "Kessler wants names.", e: { g: 6, c: -6, o: 2 }, fx: (S, A) => A.pages("jutta", 30), r: "Two men in a grey Wartburg outside her door. She waves at them every morning.", fate: ["jutta", "In 1992 she hung a copy of her surveillance report in her kitchen: ‘Waves at the car. Provocative.’"] },
      { t: "On the list for ‘Day X’", d: "Internment camps, should it be needed.", e: { g: 10, c: -12 }, fx: (S, A) => A.pages("jutta", 25), r: "Her name goes on the internment list. Should it ever be needed.", fate: ["jutta", "Found her name on an internment list in 1992. She had always thought it was an exaggerated rumour."] },
    ]
  }],
  "1989-okt": [{
    id: "zeven", tease: "On the radio: Gorbachev lands in East Berlin tomorrow. In the corridor, nobody is laughing.", via: "telefoon", title: "Forty years of the GDR", who: "Major Kessler — tense",
    text: "‘Gorbachev is in town. At the Palast der Republik they are chanting his name. Tonight we move in at the Gethsemanekirche. You choose who from your district gets picked up.’",
    choices: [
      { t: "Make a long list", d: "Everyone in your files.", e: { g: 10, c: -15, o: 8 }, fx: (S, A) => A.people().filter(p => p.status === "vrij" && p.pages >= 15).forEach(p => { A.log(p.id, "Arrested on 7 October 1989"); A.pages(p.id, 10); }), r: "Hundreds of people are picked up that night. Some are beaten. The pictures go round the world." },
      { t: "Make a short list", d: "Only the ‘ringleaders’.", e: { g: 3, c: -4, o: 4 }, r: "You choose as few names as you can. It helps a little. Not enough." },
      { t: "Refuse", d: "‘I won't do this, Genosse Major.’", e: { g: -25, c: 15, d: 20 }, flag: "refuse", r: "Silence. Kessler only says: ‘Go home.’ Two days later 70,000 people march in Leipzig. Nobody shoots." },
    ]
  }],
  "1989-nov4": [{
    id: "alex", via: "telefoon", title: "Alexanderplatz", who: "Kreisdienststelle, Saturday morning",
    text: "A demonstration, applied for by actors, and approved. At ten o'clock they gather at the ADN building on Prenzlauer Allee, then march to the Alex. Television is broadcasting it live.\n\nKessler isn't here. Nobody knows where he is.",
    choices: [
      { t: "Observe, as always", d: "A balcony, a camera.", e: { g: 2, c: -2 }, r: "Below you, hundreds of thousands of people walk past. Their placards quote their own constitution: Articles 27 and 28, freedom of expression and of assembly. You stop taking pictures." },
      { t: "Join in, in plain clothes", d: "Just one of them.", e: { c: 6, fam: 4, d: 4 }, r: "You walk among the people. On the stage: writers, actors, a pastor. And Markus Wolf, the former spymaster. You know his voice from the canteen." },
      { t: "Stay at the office", d: "Sort files. Just in case.", e: { c: -3, d: -5 }, flag: "sorted", r: "The building is quiet. There's a television in the corridor. You watch the Alex full of people, live on state TV. You turn the sound off and keep sorting." },
    ]
  }],
  "1989-nov": [{
    id: "muur", tease: "A press conference is announced for this evening. A routine one, they say.", via: "telefoon", title: "The Wall", who: "Kreisdienststelle, evening",
    text: "On the radio a Politbüro spokesman says something muddled about travel ‘immediately, without delay’. Around half past eleven the barrier goes up at Bornholmer Straße. The Wall is open.\n\nIn the corridor the shredders are running. Kessler is back. He says: ‘Everything with names in it. Tonight.’",
    choices: [
      { t: "Shred", d: "Protect the network. And yourself.", e: { c: -10, d: -30 }, flag: "shred", r: "You work until the machines overheat. Then you tear by hand.", end: true },
      { t: "Leave the files", d: "Let people read one day what happened.", e: { c: 12 }, flag: "keep", r: "You put the boxes back in the cupboard and walk outside. In the street, strangers are hugging each other.", end: true },
      { t: "To Bornholmer Straße", d: "Watch. Just watch.", e: { c: 6, fam: 10 }, flag: "walk", r: "You walk with the crowd, your service pass deep in your pocket. Someone pushes a bottle of sparkling wine into your hands. On the other side, people are clapping.", end: true },
    ]
  }],
  "1989-nov4b": [{
    id: "michaAlex", via: "dossier", person: "micha", title: "A face in the crowd", who: "Alexanderplatz, Saturday afternoon",
    cond: S => S.flags.michaFree && S.people.some(p => p.id === "micha" && p.status === "vrij"),
    text: "Somewhere near the Haus des Lehrers someone grabs your sleeve. Mohawk, a home-made placard. Micha Seidel.\n\n‘You let me go in '87. I never told anyone.’ He looks at your plain coat. ‘Today we're even, Leutnant.’",
    choices: [
      { t: "Nod", d: "Say nothing.", e: { c: 3 }, r: "He disappears into the crowd. His placard says: ‘Privileges for all!’" },
      { t: "‘Go home, Micha.’", d: "Old habits.", e: { c: -1 }, r: "He laughs. ‘Home? This is home now.’" },
    ]
  }],
};

// Conditional and random events, tested every turn (once unless repeat)
export const CONDITIONAL = [
  {
    id: "dirt", via: "dossier", title: "At the Interhotel bar", who: "Own observation",
    cond: (S, t) => TURNS[t].y >= 1988 && S.flags.fuchsMet && S.fuchs >= 20 && !S.flags.fuchsDirt, chance: 0.5,
    text: "You see Oberleutnant Fuchs in the bar of the Interhotel. He slides an envelope of West marks across to a man with a Rolex.",
    choices: [
      { t: "Remember it", d: "This could come in handy.", e: {}, flag: "fuchsDirt", r: "You write the date and time on a cigarette packet." },
      { t: "Report it at once", d: "He's your rival.", e: { g: 6, fu: 40 }, flag: "fuchsDirt", r: "Kessler reads your report and says: ‘Interesting.’ Fuchs is suspended for a week. He knows who it was." },
    ]
  },
  {
    id: "nachtmerrie", via: "gezin", title: "Three in the morning", who: "At home",
    cond: S => S.geweten < 25,
    text: "You wake up. Katrin says you were calling out names in your sleep. Names she doesn't know.",
    choices: [
      { t: "‘It's nothing. Go back to sleep.’", d: "", e: { fam: -6 }, r: "She turns over. You lie awake until morning." },
      { t: "A glass of schnapps", d: "", e: { fam: -3, c: 2 }, r: "It helps for a while. It never helps for long." },
    ]
  },
  {
    id: "onderzoek", via: "telefoon", title: "Hauptabteilung Kader", who: "A man you don't know",
    cond: S => S.dossier >= 60,
    text: "‘Leutnant, personnel has a few questions. Routine. Your brother. Your contacts. A leak in 1987. We'll be in touch.’",
    choices: [
      { t: "Show extra zeal", d: "A few quick results. Whatever it takes.", e: { g: 6, c: -8, d: -8 }, r: "You work seven days a week for three weeks. The inquiry is ‘provisionally’ suspended." },
      { t: "Stay calm", d: "They have nothing.", e: { d: 4 }, r: "The man nods and leaves. You see him in the corridor twice more." },
    ]
  },
  {
    id: "katrinweg", via: "gezin", title: "An empty bed", who: "Katrin",
    cond: S => S.gezin < 20,
    text: "When you get home there is a bag by the door. Katrin: ‘I'm taking Jens to my mother's in Rostock for a while. You're never here anyway. And when you are, you're not.’",
    choices: [
      { t: "Beg her to stay", d: "You promise to work less.", e: { fam: 20, mk: -2, g: -3 }, r: "She stays. For now. ‘Show me,’ she says." },
      { t: "Let her go", d: "", e: { fam: -10, c: -3 }, flag: "alone", r: "The door shuts. The flat is silent, apart from the ticking of the stove." },
    ]
  },
  {
    id: "trabant", via: "gezin", title: "The Trabant", who: "Letter from the IFA sales office",
    cond: (S, t) => S.gunst >= 70 && TURNS[t].y >= 1986,
    text: "After eleven years of waiting, sped up thanks to ‘special merit’: your Trabant 601 is ready. Colour: papyrus white.",
    choices: [{ t: "Collect it", d: "", e: { fam: 10 }, r: "Jens gets to honk the horn. The neighbours watch. Herr Pohl writes something down, but you don't see that." }]
  },
  {
    id: "westpakket", via: "dossier", title: "A parcel from the West", who: "Abteilung M (postal control)",
    cond: (S, t) => t >= 2, chance: 0.25,
    text: "A parcel from Cologne for someone in your district: coffee, tights, chocolate and a book by a banned author. Your colleagues in the post department ask what to do with it.",
    choices: [
      { t: "Send it on, minus the book", d: "", e: { g: 1 }, r: "The parcel arrives, a little lighter." },
      { t: "Coffee and chocolate for the department", d: "Everybody does it.", e: { c: -3, g: 2 }, r: "The coffee is delicious. The recipient writes a complaint. It ends up on your desk." },
      { t: "Send everything on", d: "The book too.", e: { c: 3, d: 3 }, r: "Somewhere in Prenzlauer Berg, a book is being read that shouldn't be there." },
    ]
  },
  {
    id: "imstop", via: "dossier", title: "An IM wants out", who: "Meeting in a konspirative Wohnung",
    cond: S => S.people.some(p => p.status === "im"), chance: 0.2, repeat: true,
    text: "", // dynamic
    dyn: (S, A) => { const im = A.rand(S.people.filter(p => p.status === "im")); return { pid: im.id, text: `IM „${im.code}“ (${im.name}) sits trembling across from you. ‘I can't do this any more. My neighbours look at me strangely. Let me stop.’` }; },
    choices: [
      { t: "Let them go", d: "You lose an IM.", e: { c: 4, g: -2 }, fx: (S, A, ctx) => { A.setStatus(ctx.pid, "vrij"); A.log(ctx.pid, "Allowed to stop as an IM"); }, r: "{Z} walks out the door, relieved, and does not look back." },
      { t: "Threaten", d: "‘Do you want your neighbours to know you're an IM?’", e: { c: -7 }, fx: (S, A, ctx) => { const p = A.p(ctx.pid); p.honesty = Math.max(10, p.honesty - 25); }, r: "{Z} stays. But the reports get shorter, and vaguer." },
    ]
  },
  // ---------- uitgestelde gevolgen: keuzes van vroeger komen terug ----------
  {
    id: "brandtCar", via: "dossier", person: "brandt", title: "A breakdown on Greifswalder Straße", who: "Dieter Brandt, car mechanic",
    cond: (S, t) => TURNS[t].y >= 1986 && S.flags.brandtSpared && S.people.some(p => p.id === "brandt" && p.status === "vrij"), chance: 0.6,
    text: "The Wartburg from the motor pool dies at a red light. Of all the people in Prenzlauer Berg, it is Dieter Brandt who stops. He has the bonnet up before you can say anything.\n\n‘Three years ago someone made a report about me disappear,’ he says to the engine. ‘I don't know who. But I'd buy him a beer.’",
    choices: [
      { t: "Accept the help", d: "And listen.", e: { c: 2 }, fx: (S, A) => { const c = A.workers("fabriek").filter(p => p.id !== "brandt" && p.status === "vrij"); const q = A.rand(c); if (q) { const t = A.rand(q.traits.filter(t => !q.known[t])); if (t) { q.known[t] = { s: "zeker" }; A.log(q.id, "Mentioned by Brandt"); } } }, r: "While he works he talks about the factory: who is fiddling the overtime, who wants to leave. He doesn't know he is talking to the Ministry. Or he knows exactly." },
      { t: "‘I'll manage.’", d: "Keep your distance.", e: {}, r: "Brandt shrugs and wipes his hands. ‘As you like, comrade.’" },
    ]
  },
  {
    id: "brandtDrunk", via: "telefoon", person: "brandt", title: "Shouting in the street", who: "Volkspolizei, Prenzlauer Berg",
    cond: (S, t) => TURNS[t].y >= 1987 && S.flags.brandtOV && S.people.some(p => p.id === "brandt" && free(p)), chance: 0.6,
    text: "‘A drunk outside Kollwitzstraße 12, comrade. Dieter Brandt, lost his job in '85. He is shouting that you ruined him. By name. The whole street is at the windows.’",
    choices: [
      { t: "Have him taken away", d: "A night in the cells.", e: { c: -4, d: -2, g: 1 }, fx: (S, A) => A.log("brandt", "Detained overnight for ‘disturbing the peace’"), r: "Two Vopos lead him off. In the morning your neighbours greet you a little more politely than usual. That is worse." },
      { t: "Go down and talk to him", d: "In front of everyone.", e: { c: 4, d: 5 }, r: "You stand in the street in your slippers. Brandt cries. Herr Pohl watches from his window and writes something down." },
      { t: "Ignore it", d: "He'll stop eventually.", e: { o: 2, fam: -4 }, r: "He shouts until one in the morning. Jens asks who the man is. You don't answer." },
    ]
  },
  {
    id: "annaPost", via: "dossier", person: "anna", title: "A postcard from Hamburg", who: "Abteilung M (postal control)",
    cond: (S, t) => TURNS[t].y >= 1986 && S.flags.annaPassed && S.people.some(p => p.id === "anna" && p.status === "uitgereisd"),
    text: "Postal control forwards a copy. A card from Hamburg, the harbour at night, addressed to ‘the officer in Kollwitzstraße’. On the back: ‘Thank you for the stamp. A.’\n\nThe original has gone to Kessler.",
    choices: [
      { t: "Explain it to Kessler", d: "‘Routine. She was let go legally.’", e: { g: -2, d: -2 }, r: "Kessler reads the card twice. ‘Sentimental people,’ he says. ‘In the West they are all sentimental.’" },
      { t: "Say nothing", d: "Hope it gets lost in a drawer.", e: { d: 6, c: 2 }, r: "It does not get lost. Nothing ever gets lost here." },
    ]
  },
  {
    id: "moewe", via: "dossier", person: "anna", title: "IM „Möwe“ wants her reward", who: "Treff in the Konspirative Wohnung „Linde“",
    cond: (S, t) => TURNS[t].y >= 1987 && S.flags.annaIM && S.people.some(p => p.id === "anna" && p.status === "im"),
    text: "Anna Weiss sits on the edge of the armchair. ‘Three years. You promised. My fiancé has married someone else in Hamburg. I want to leave anyway. You promised me.’",
    choices: [
      { t: "Keep the promise", d: "You lose an informer.", e: { c: 5, g: -3 }, fx: (S, A) => { A.setStatus("anna", "vrij"); A.later(2, "anna-leave"); A.log("anna", "Released as IM, exit approved"); }, r: "You sign the form. Anna doesn't thank you. She just looks at your hand holding the pen." },
      { t: "String her along", d: "‘Next year. Definitely.’", e: { c: -6 }, fx: (S, A) => { const a = A.p("anna"); a.loyal = Math.max(0, (a.loyal || 30) - 30); a.honesty = Math.max(10, a.honesty - 20); }, r: "She nods. Her reports become shorter. And less true." },
    ]
  },
  {
    id: "hertaCake", via: "gezin", person: "herta", title: "A cake at the door", who: "Herta Schulz, caretaker",
    cond: (S, t) => TURNS[t].y >= 1987 && S.flags.hertaIM,
    text: "Herta Schulz is at your door with a Bienenstich. ‘My boy got his place at the Charité. Medicine! I know who to thank.’\n\nKatrin is standing behind you in the hall. ‘Why is the caretaker from Greifswalder Straße thanking you?’",
    choices: [
      { t: "Take the cake", d: "‘Herta exaggerates.’", e: { fam: -4, c: -2 }, r: "Katrin cuts the cake without a word. Nobody eats it." },
      { t: "Send her away", d: "Not on your doorstep.", e: { fam: -1 }, fx: (S, A) => { const h = A.p("herta"); if (h) h.loyal = Math.max(0, (h.loyal || 50) - 15); }, r: "Herta goes red and walks down the stairs with the cake. She will not bring one again." },
    ]
  },
  {
    id: "lenaJens", via: "gezin", person: "lena", title: "Jens has a fever", who: "Poliklinik Prenzlauer Berg",
    cond: (S, t) => TURNS[t].y >= 1986 && S.flags.lenaLet && S.people.some(p => p.id === "lena" && p.status === "vrij"),
    text: "Jens has been burning up for three days. At the Poliklinik there are no antibiotics. The nurse on duty is Lena Vogt. She looks at you for a long moment, then fetches a small packet from her own bag. A West German brand.\n\n‘From my sister in Cologne. Her letters arrive these days.’",
    choices: [
      { t: "Thank her", d: "Quietly.", e: { fam: 8, c: 3 }, r: "By Sunday Jens is out of bed and arguing about football. Katrin asks where the medicine came from. ‘A nurse,’ you say. It is the truth." },
      { t: "Report the West medicine", d: "Rules are rules.", e: { fam: 4, c: -10, g: 3 }, fx: (S, A) => { A.pages("lena", 12); A.log("lena", "Reported for handing out West German medicine"); }, r: "Jens gets better. Lena Vogt is given a reprimand. When you pass her in the corridor, she looks right through you." },
    ]
  },
  {
    id: "kuehnWife", via: "dossier", person: "kuehn", title: "An envelope at the gate", who: "Gate of the Kreisdienststelle",
    cond: (S, t) => TURNS[t].y >= 1987 && S.flags.kuehnZers,
    text: "A woman hands an envelope to the guard and walks away without waiting. Inside: copies of the anonymous letters that broke Pastor Kühn's marriage. And one sheet in her own handwriting: ‘I don't know your name. But I know you exist.’",
    choices: [
      { t: "File it", d: "Another sheet for the file.", e: { c: -3 }, r: "You punch two holes and file it under K. It is the only document in the file that is addressed to you." },
      { t: "Stop the measure", d: "Quietly close the file.", e: { c: 5, g: -3 }, r: "No more letters go to the rectory. It is too late for that marriage. It might not be too late for something else." },
    ]
  },
  {
    id: "leakThanks", via: "dossier", title: "A line in a samizdat sheet", who: "Seized at a raid",
    cond: (S, t) => TURNS[t].y >= 1988 && S.flags.leak,
    text: "Page four of a seized Umweltblätter, at the bottom: ‘Thank you to the friend who phoned in November. You know who you are.’\n\nFuchs has underlined it in red and put it in your tray.",
    choices: [
      { t: "Burn your copy", d: "And act as if nothing happened.", e: { d: 4, fu: 5 }, r: "Fuchs asks about the sheet the next day. ‘Which sheet?’ you say." },
      { t: "Keep it", d: "In your inside pocket.", e: { d: 6, c: 3 }, r: "You read it again in the tram. You know who you are. That is the problem." },
    ]
  },
  {
    id: "warnedHelp", via: "gezin", title: "A note under the door", who: "Kollwitzstraße 12, your flat",
    cond: (S, t) => (S.warned || []).some(w => t >= w.t + 2),
    text: "A folded note under your door, no name: ‘Someone phoned us in time. If it was you: thank you. Be careful in your own building. The old man on your landing writes everything down.’",
    choices: [
      { t: "Burn the note", d: "In the stove.", e: { c: 3 }, flag: "pohl", r: "You watch it curl up. Then you look at Herr Pohl's door for a long time." },
    ]
  },
  // ---------- het gezin raakt betrokken ----------
  {
    id: "jensPunk", via: "dossier", title: "A boy at the concert", who: "IM report, Zionskirche",
    cond: (S, t) => TURNS[t].y >= 1987 && t >= 19,
    text: "Report on Saturday's ‘blues mass’ in the Zionskirche. List of known faces. At the bottom: ‘Also present: a boy of about twelve, son of an employee of the Ministry, living in Kollwitzstraße.’\n\nThat is Jens.",
    choices: [
      { t: "Tear the page out", d: "Nobody needs to read that line.", e: { d: 6, c: 2 }, r: "The page goes into the stove at home. Jens asks what you are burning. ‘Old receipts,’ you say.", flag: "jensHidden" },
      { t: "Talk to Jens", d: "Tonight, in the kitchen.", e: { fam: -8, c: -1 }, r: "‘You read reports about me?’ Jens shouts. Katrin closes the kitchen door. Then she opens it again, to listen." },
      { t: "Let it go upstairs", d: "Nobody can say you protect your own.", e: { g: 3, d: -3, fam: -14, c: -6 }, r: "Jens's school receives a letter. His class teacher asks him to stay behind. He is twelve." },
    ]
  },
  {
    id: "katrinEingabe", via: "gezin", person: "lena", title: "Katrin's signature", who: "Katrin",
    cond: (S, t) => TURNS[t].y >= 1988 && !S.flags.alone,
    text: "‘Lena Vogt from the Poliklinik asked me to sign an Eingabe. About the medicine. Twenty women from the building have signed.’ Katrin holds the pen. ‘Should I?’",
    choices: [
      { t: "‘Don't.’", d: "For your own sake.", e: { fam: -10, c: -2 }, r: "She puts the pen down. ‘For your sake, you mean.’" },
      { t: "‘Sign it.’", d: "It's a complaint, not a crime.", e: { fam: 6, c: 3, d: 6 }, r: "Katrin signs with your surname. In black and white, on a list that will end up in a file. Possibly yours." },
      { t: "‘Tell me who else signs.’", d: "Your wife as a source.", e: { fam: -18, c: -10, g: 3 }, fx: (S, A) => { A.know("lena", "klager"); A.pages("lena", 8); }, r: "Katrin gives you three names, slowly. Then she goes to bed without saying goodnight. She won't ask you anything for weeks." },
    ]
  },
  {
    id: "jensArmy", via: "gezin", title: "Three years", who: "Jens, 14, and his class teacher",
    cond: (S, t) => TURNS[t].y >= 1989 && !S.flags.alone,
    text: "The class teacher came by. Jens can go to the EOS, later study. On one condition: he signs up for three years in the NVA instead of eighteen months. ‘Everyone in the class is signing,’ says Jens. He looks at you. He doesn't want to.",
    choices: [
      { t: "‘Sign. It's only three years.’", d: "His future comes first.", e: { fam: -10, g: 2 }, r: "Jens signs. He doesn't look at you while he does it." },
      { t: "Back his refusal", d: "‘Eighteen months is enough.’", e: { fam: 8, d: 4, g: -2 }, r: "The school notes it. Your department notes it. Jens hugs you, for the first time in two years." },
      { t: "Make a phone call", d: "A word in the right ear.", e: { g: -4, d: 3, fam: 4 }, r: "One call to the district education office and the condition is gone. Jens never finds out why it was so easy. Like so many people." },
    ]
  },
  // ---------- Fuchs onderzoekt jou: microfoons in je eigen flat ----------
  {
    id: "homeBugs", via: "gezin", title: "The phone clicks", who: "Katrin",
    cond: (S, t) => TURNS[t].y >= 1988 && S.flags.fuchsMet && (S.fuchs >= 25 || S.dossier >= 40) && !S.homeBugs,
    text: "‘Our phone clicks when I pick it up. And yesterday a man from the housing office was in the flat when I came home. He said he was checking the stove.’ Katrin lowers her voice. ‘We don't have a problem with the stove.’",
    choices: [
      { t: "‘I'll have a look.’", d: "Search your own flat: Kollwitzstraße 12.", e: {}, fx: (S, A) => A.plantHomeBugs(), r: "You know how it is done. You have ordered it often enough. Go home and search: the stairwell at Kollwitzstraße 12, then your flat." },
      { t: "‘You're imagining it.’", d: "Better not to know.", e: { fam: -4, d: 3 }, fx: (S, A) => A.plantHomeBugs(), r: "You say it a little too loudly. As if someone else should hear it too." },
    ]
  },
];
