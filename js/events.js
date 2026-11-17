// ===================== VERHAAL: vaste en voorwaardelijke gebeurtenissen =====================
// e: g=gunst c=geweten o=onrust d=eigen dossier fam=gezin fu=rivaliteit Fuchs res=resultaten mk=mankracht volgende beurt (negatief = minder)

export const STORY = {
  "1985-0": [{
    id: "intro", via: "telefoon", title: "Welkom op de Kreisdienststelle", who: "Major Horst Kessler — je chef",
    text: "‘Leutnant. Uw bureau, uw wijk: Prenzlauer Berg. Kunstenaars, dominees, klagers. Ik wil weten wat ze denken vóórdat ze het zelf weten.\n\nU heeft beperkte mankracht per beurt. Gebruik die in de wijk: observeren, afluisteren, informanten werven. Elk jaar in de herfst beoordeel ik u op resultaten en op uw netwerk van IM's.\n\nEn Leutnant — iedereen wordt in de gaten gehouden. Ook wij.’",
    choices: [{ t: "‘Jawohl, Genosse Major.’", d: "De telefoon klikt.", e: {}, r: "Je legt de hoorn neer. Op je bureau ligt al een stapel dossiers. Tik op de kaart aan de muur om de wijk te bekijken." }]
  }],
  "1985-1": [{
    id: "brandt", via: "dossier", person: "brandt", title: "De mopperende monteur", who: "Dieter Brandt, 34, automonteur — VEB Bergmann-Borsig",
    src: "IM „Rose“", text: "Brandt vertelt in de kantine moppen over de Generalsekretär. Luistert 's avonds naar RIAS. Zei: ‘Over tien jaar staat hier niks meer van.’ Verder: goede vakman, geliefd bij collega's.",
    choices: [
      { t: "Archiveren", d: "Moppen zijn geen misdaad.", e: { g: -4, c: 2 }, r: "Je legt het rapport onderop de stapel. Kessler fronst als hij de lege kolom ziet.", fate: ["brandt", "Las in 1992 zijn dossier: drie pagina's, daarna niets. ‘Iemand heeft me laten gaan,’ zei hij."] },
      { t: "Waarschuwingsgesprek", d: "Hem laten schrikken. Klein, effectief.", e: { g: 3, c: -4, o: -1 }, fx: (S, A) => { A.p("brandt").dis -= 10; A.p("brandt").fear += 30; }, r: "Twee mannen in leren jassen wachten Brandt op bij de fabriekspoort. Hij vertelt geen moppen meer.", fate: ["brandt", "Bleef monteur. Vertelde zijn kinderen pas na 1990 over het ‘gesprek’. Sliep jaren slecht."] },
      { t: "Operativer Vorgang openen", d: "Volledige observatie. Telefoon, post, collega's.", e: { g: 8, c: -9, res: 1 }, fx: (S, A) => { A.pages("brandt", 40); A.know("brandt", "drank"); A.know("brandt", "rias"); }, r: "Een nieuw dossier: OV „Schraube“. Kessler knikt goedkeurend.", fate: ["brandt", "Verloor in 1986 zijn baan zonder reden. Vond in 1992 in zijn dossier de naam van zijn beste vriend als informant."] },
    ]
  }],
  "1985-1b": [{
    id: "kuehn", via: "dossier", person: "kuehn", title: "De kelder onder de kerk", who: "Dominee Martin Kühn — Zionskirche",
    src: "IM „Orgel“", text: "In de kelder van de pastorie verzamelen jongeren boeken over milieu en vrede. Er wordt een stencilmachine gebruikt. Kühn noemt het ‘onze bibliotheek’.",
    choices: [
      { t: "Laten begaan", d: "Het is een kerk. Te gevoelig.", e: { g: -8, c: 3, o: 3, d: 4 }, r: "‘Laten begaan?’ Kessler kijkt je lang aan. ‘We praten hier nog over, kameraad.’", fate: ["kuehn", "Zijn kelderbibliotheek groeide uit tot een ontmoetingsplek van de oppositie."] },
      { t: "Een IM infiltreren", d: "Iemand van ons in de groep. (+1 IM)", e: { g: 7, c: -5 }, fx: (S, A) => A.spawnIM("Orgel-2", "kerk"), r: "Een jonge vrijwilliger meldt zich in de kelder. Hij is van jou.", fate: ["kuehn", "Ontdekte in 1992 dat zijn trouwste vrijwilliger voor de Stasi werkte. Ze hebben elkaar nooit meer gesproken."] },
      { t: "Zersetzung", d: "Geruchten over een affaire. Brieven aan zijn vrouw.", e: { g: 11, c: -16, res: 1 }, fx: (S, A) => { A.p("kuehn").dis -= 20; A.pages("kuehn", 60); A.log("kuehn", "Zersetzung: anonieme brieven"); }, r: "Anonieme brieven bereiken de pastorie. Zijn huwelijk wankelt. Niemand weet waar het vandaan komt.", fate: ["kuehn", "Zijn huwelijk hield het niet. Pas in 1992 las hij dat de brieven door het ministerie waren geschreven."] },
    ]
  }],
  "1985-2": [{
    id: "anna", via: "dossier", person: "anna", title: "Een kaartje naar Hamburg", who: "Anna Weiss, 22, studente geneeskunde",
    src: "Afdeling Paspoorten", text: "Weiss heeft een Ausreiseantrag ingediend. Haar verloofde woont in Hamburg. Uitstekende cijfers. Geen politieke activiteiten bekend.",
    choices: [
      { t: "Aanvraag doorsturen", d: "Laat het systeem z'n gang gaan.", e: { g: -5, c: 5 }, fx: (S, A) => { A.later(5, "anna-leave"); }, r: "Je stempel staat erop. Over een jaar of twee mag ze misschien gaan.", fate: ["anna", "Vertrok in 1987 naar Hamburg. Werd kinderarts."] },
      { t: "Studieplaats laten intrekken", d: "Aanvragers verdienen geen privileges.", e: { g: 6, c: -10, o: 1 }, fx: (S, A) => { A.p("anna").job = "wasserijmedewerkster"; A.pages("anna", 20); }, r: "De universiteit schrijft haar uit. Ze werkt nu in een wasserij.", fate: ["anna", "Mocht pas in 1989 vertrekken. Begon op haar 27e opnieuw aan haar studie."] },
      { t: "Werven als IM „Möwe“", d: "Snellere uitreis... als ze over medestudenten rapporteert.", e: { g: 7, c: -12 }, fx: (S, A) => { A.makeIM("anna", "Möwe"); }, r: "Ze huilt in de verhoorkamer, en tekent.", fate: ["anna", "Rapporteerde twee jaar over vrienden. Vertrok in 1988. Kon haar eigen codenaam in andermans dossiers niet aanzien."] },
    ]
  }],
  "1986-0": [{
    id: "thomas", via: "dossier", person: "thomas", title: "Een naam die je kent", who: "Thomas — jouw broer, ingenieur bij VEB Bergmann-Borsig",
    src: "IM „Kranich“", text: "Ingenieur T. sprak tijdens de lunch over ‘die oude mannen in het Politbüro’ en zei dat hij ‘er klaar mee is’. Verzoek om verdere opdracht.", note: "Je leest het twee keer. Het is je broer.",
    choices: [
      { t: "Het rapport laten verdwijnen", d: "Niemand hoeft het te weten.", e: { c: 4, d: 8 }, flag: "cover", r: "Het rapport gaat door de versnipperaar. Je handen trillen een beetje.", fate: ["thomas", "Wist nooit hoeveel gevaar hij liep. Hoorde het pas in 1992 van jou."] },
      { t: "Hem zelf waarschuwen", d: "Een avondwandeling langs de Spree.", e: { c: 6, d: 4, fam: 5 }, flag: "warn", fx: (S, A) => { A.p("thomas").dis -= 10; }, r: "‘Hou je mond op je werk,’ zeg je. Thomas kijkt je aan alsof hij je voor het eerst ziet.", fate: ["thomas", "Begreep die avond wat zijn broer deed. Ze spraken jaren alleen nog op verjaardagen."] },
      { t: "Doorsturen naar Kessler", d: "Geen uitzonderingen. Ook niet voor familie.", e: { g: 12, c: -22, fam: -15, res: 1 }, flag: "betray", fx: (S, A) => { A.pages("thomas", 30); A.p("thomas").job = "ingenieur — overgeplaatst naar Bitterfeld"; }, r: "Kessler slaat je op de schouder. ‘Dát is een tsjekist.’ Thomas wordt overgeplaatst naar een chemiefabriek in Bitterfeld.", fate: ["thomas", "Las in 1992 wie zijn rapport had doorgestuurd. Hij heeft je nooit meer gesproken."] },
    ]
  }],
  "1986-1": [{
    id: "tsjernobyl", via: "telefoon", title: "Tsjernobyl", who: "Major Kessler",
    text: "‘In de Poliklinik vertellen artsen patiënten dat ze geen sla moeten eten en kinderen binnen moeten houden. Westpropaganda over een ongelukje in de Oekraïne. Neues Deutschland meldt niets bijzonders. Ik wil dat dit stopt.’",
    choices: [
      { t: "Artsen laten intimideren", d: "Gesprekken met het hele team.", e: { g: 6, c: -10, o: -3 }, fx: (S, A) => A.workers("kliniek").forEach(p => { p.fear += 20; A.pages(p.id, 5); }), r: "De artsen zwijgen. Groente uit de regio, die het Westen niet meer wil kopen, ligt goedkoop in de Kaufhalle." },
      { t: "Alleen noteren", d: "Je eigen kinderen houd je binnen.", e: { g: -2, c: 3, o: 3, fam: 4 }, r: "Je schrijft een kort rapport. Thuis zeg je tegen Katrin dat Jens een week binnen moet spelen. Ze vraagt waarom. Je antwoordt niet." },
      { t: "Lena Vogt aanpakken", d: "Zij heeft het hardst geklaagd.", e: { g: 4, c: -6 }, fx: (S, A) => { A.pages("lena", 15); A.know("lena", "klager"); A.log("lena", "Gesprek over ‘paniekzaaierij’ (Tsjernobyl)"); }, r: "Vogt wordt een middag ondervraagd. Ze zegt alleen: ‘Ik heb ook kinderen, Leutnant.’" },
    ]
  }],
  "1986-1b": [{
    id: "balaton", via: "gezin", title: "Het Balatonmeer", who: "Katrin, je vrouw",
    text: "‘Mijn zus heeft een plek op een camping aan het Balatonmeer voor ons geregeld. Twee weken, in augustus. Jens praat over niets anders. Je komt toch mee?’",
    choices: [
      { t: "Mee op vakantie", d: "Volgende beurt 2 minder mankracht.", e: { fam: 18, g: -3, mk: -2 }, r: "In Hongarije zie je West-Duitse gezinnen in Mercedessen. Jens staart naar ze. Jij ook, als niemand kijkt." },
      { t: "Werk gaat voor", d: "Ze gaan zonder jou.", e: { fam: -12, g: 4 }, r: "Katrin zegt niets. Jens stuurt een ansichtkaart, aan ‘Mama en Papa’, maar alleen Mama staat erop." },
    ]
  }],
  "1986-2": [{
    id: "jens", via: "gezin", title: "‘Wat doe jij eigenlijk?’", who: "Jens, je zoon, 11 jaar",
    text: "Aan het avondeten: ‘Papa, in de klas moesten we vertellen wat onze ouders doen. Ik wist het niet. Wat doe jij eigenlijk?’",
    choices: [
      { t: "‘Ik werk bij het ministerie van binnenlandse zaken.’", d: "Een veilige leugen.", e: { fam: 0, c: -1 }, r: "Jens knikt. Katrin kijkt naar haar bord." },
      { t: "‘Ik bescherm ons land tegen vijanden.’", d: "Trots. En waar, toch?", e: { fam: 4, c: -3 }, r: "Jens' ogen worden groot. De volgende dag vertelt hij het op school. Je krijgt er een notitie over van de afdeling." , fx: (S, A) => { S.dossier += 3; } },
      { t: "‘Dat mag ik niet vertellen, jongen.’", d: "Eerlijk, op een manier.", e: { fam: -4, c: 2 }, r: "‘Dus het is geheim?’ Jens vindt het spannend. Jij vindt het iets anders." },
    ]
  }],
  "1987-0": [{
    id: "fuchs", via: "telefoon", title: "Een nieuwe collega", who: "Major Kessler en Oberleutnant Fuchs",
    text: "Kessler stelt Oberleutnant Rüdiger Fuchs voor: jong, ambitieus, net terug van de hogeschool in Potsdam-Eiche. ‘Fuchs neemt de Greifswalder Straße van u over, tenzij u laat zien dat u hem nodig heeft.’\n\nFuchs glimlacht. ‘We kunnen samenwerken. U deelt uw IM's met mij, ik deel mijn successen.’",
    choices: [
      { t: "Samenwerken", d: "Hij krijgt inzage in je netwerk.", e: { g: -2, fu: -20 }, r: "Fuchs is charmant. Je weet niet goed wat hij met je informatie doet.", flag: "fuchsAlly" },
      { t: "Beleefd afwijzen", d: "Je wijk is van jou.", e: { fu: 15 }, r: "‘Natuurlijk,’ zegt Fuchs. ‘Ik begrijp het helemaal.’ Hij schrijft iets op." },
      { t: "Hem meteen op zijn plaats zetten", d: "‘Ik werk hier al twee jaar, Oberleutnant.’", e: { g: 3, fu: 35 }, r: "Kessler lacht. Fuchs niet." },
    ]
  }],
  "1987-0b": [{
    id: "lena", via: "dossier", person: "lena", title: "Een brief naar het Westen", who: "Lena Vogt, 41, verpleegkundige — Poliklinik",
    src: "Postcontrole, Abteilung M", text: "Onderschepte brief aan zus in Keulen: ‘We hebben geen insuline meer op de afdeling. De dokters schamen zich.’ Brief is in beslag genomen.",
    choices: [
      { t: "Brief alsnog laten bezorgen", d: "Ze vertelt alleen de waarheid.", e: { g: -6, c: 7, d: 5 }, r: "Een week later ligt de brief in Keulen. Niemand merkt iets, denk je.", fate: ["lena", "Haar zus stuurde jarenlang medicijnen in pakketjes. Een aantal kwam aan."] },
      { t: "Brief vernietigen, verder niets", d: "Probleem opgelost.", e: { g: 2, c: -2 }, r: "De brief verdwijnt. Lena vraagt zich af waarom haar zus nooit terugschrijft.", fate: ["lena", "Dacht jarenlang dat haar zus haar negeerde."] },
      { t: "Disciplinaire procedure", d: "‘Verspreiding van staatsvijandige laster.’", e: { g: 8, c: -12, res: 1 }, fx: (S, A) => { A.pages("lena", 45); A.p("lena").job = "nachtzuster, bejaardentehuis"; }, r: "Lena wordt overgeplaatst naar de nachtdienst in een bejaardentehuis buiten de stad.", fate: ["lena", "Keerde in 1991 terug naar de Poliklinik. Haar dossier telde 89 pagina's."] },
    ]
  }],
  "1987-1": [{
    id: "mauerkonzert", via: "telefoon", person: "micha", title: "‘Die Mauer muss weg!’", who: "Volkspolizei, Unter den Linden",
    text: "In juni speelden Westerse bands vlak bij de Rijksdag. Honderden Oost-Berlijnse jongeren luisterden aan deze kant van de muur en riepen ‘Die Mauer muss weg!’. De Vopo heeft er tientallen opgepakt. Eén van hen woont in jouw wijk: Micha Seidel, 19, leerling-lasser.",
    choices: [
      { t: "Laten vrijlaten", d: "Een domme jongen. Hij heeft een les gehad.", e: { g: -4, c: 5 }, r: "Micha loopt de cel uit. Hij kijkt niet om.", fate: ["micha", "Werd in 1990 lasser in West-Berlijn. Hij hoorde nooit wie hem had laten gaan."] },
      { t: "Hem werven", d: "Punks kennen punks. (+1 IM)", e: { g: 6, c: -9 }, fx: (S, A) => A.makeIM("micha", "Gitarre"), r: "Na drie nachten zonder slaap tekent hij. ‘Mag ik nu naar huis?’", fate: ["micha", "Rapporteerde over zijn eigen band. Stopte er in 1989 mee; zijn vrienden vonden het in 1993 terug in de dossiers."] },
      { t: "Aanklagen wegens ‘rowdyisme’", d: "§215. Een voorbeeld voor anderen.", e: { g: 9, c: -12, o: -2, res: 1 }, fx: (S, A) => A.setStatus("micha", "gevangen"), r: "Micha krijgt tien maanden. Op zijn werk hangt de ploegleider een waarschuwing op.", fate: ["micha", "Zat tien maanden vast. Werd in 1989 door de Bondsrepubliek vrijgekocht."] },
    ]
  }],
  "1987-2": [{
    id: "inval", via: "telefoon", title: "De inval", who: "Major Kessler — persoonlijk bevel",
    text: "‘Vannacht rollen we die kelderbibliotheek bij de Zionskirche op. U leidt team twee. Stencilmachines, drukwerk, namen. Begrepen?’",
    choices: [
      { t: "Meedoen, volgens bevel", d: "Je bent officier.", e: { g: 10, c: -8, o: 4, res: 1 }, fx: (S, A) => { A.workers("kerk").forEach(p => A.pages(p.id, 10)); }, r: "Om middernacht dragen jullie dozen naar buiten. Zeven jongeren worden meegenomen. Buiten staan mensen met kaarsen. Het worden er elke avond meer." },
      { t: "Een tip lekken", d: "Een anoniem telefoontje vanuit een cel.", e: { g: -6, c: 10, d: 14 }, flag: "leak", r: "Als jullie aankomen, is de stencilmachine weg. Kessler kijkt iedereen in het team lang aan. Ook jou." },
      { t: "Je ziek melden", d: "Iemand anders doet het wel.", e: { g: -5, c: 2, d: 4, fu: 10 }, r: "Fuchs leidt jouw team. Hij krijgt een bonus. Jij ligt die nacht wakker." },
    ]
  }],
  "1988-0": [{
    id: "llDemo", via: "telefoon", title: "Rosa Luxemburg", who: "Major Kessler",
    text: "‘Zondag is de jaarlijkse herdenkingsmars voor Luxemburg en Liebknecht. Onze inlichtingen zeggen dat dissidenten mee willen lopen met een eigen spandoek: Vrijheid is altijd de vrijheid van de andersdenkende. Een citaat van Rosa zelf, de brutaliteit.’",
    choices: [
      { t: "Preventieve arrestaties", d: "Iedereen met een dossier blijft zondag thuis.", e: { g: 9, c: -10, o: 3, res: 1 }, fx: (S, A) => { A.people().filter(p => p.status === "vrij" && p.dis > 45).slice(0, 3).forEach(p => { A.pages(p.id, 15); A.log(p.id, "Preventief vastgehouden (januari 1988)"); }); }, r: "Tientallen mensen worden opgepakt voordat ze het spandoek kunnen ontrollen. In het Westen is het groot nieuws. In de kerken in jouw wijk wordt gebeden voor de gearresteerden." },
      { t: "Alleen observeren", d: "Laat ze lopen, maak foto's.", e: { g: 2, c: -2 }, fx: (S, A) => { A.people().filter(p => p.dis > 45).forEach(p => A.pages(p.id, 4)); }, r: "Je fotografen schieten vijf rolletjes vol. De spandoeken zijn na dertig seconden weg." },
    ]
  }, {
    id: "pohl", via: "gezin", title: "Je eigen buurman", who: "Katrin",
    text: "Katrin aan tafel: ‘Herr Pohl van hiernaast vroeg weer wanneer je 's avonds thuiskomt. En of je broer nog langskomt. Hij vraagt het elke week.’\n\nPohl is 67, gepensioneerd spoorman, altijd vriendelijk.",
    choices: [
      { t: "In de kartotheek kijken", d: "Kost 1 mankracht.", e: { mk: -1 }, flag: "pohl", r: "Zijn kaart is ‘gesperrt’: geblokkeerd, voor jouw rang niet in te zien. Iemand boven jou heeft hem op jou gezet." },
      { t: "Negeren", d: "Oude mensen zijn nieuwsgierig.", e: {}, r: "Je doet het af als roddelzucht. Pohl blijft vriendelijk groeten." },
    ]
  }],
  "1988-1": [{
    id: "fuchs2", via: "telefoon", title: "Fuchs maakt zijn zet", who: "Oberleutnant Fuchs",
    cond: S => S.fuchs >= 30,
    text: "Fuchs staat in je deuropening. ‘Ik heb toevallig gezien dat een van uw rapporten nooit in het archief is aangekomen. En dat de kerk in '87 gewaarschuwd werd. Toeval, natuurlijk. Of wilt u er even over praten?’",
    choices: [
      { t: "Hem chanteren terug", d: "Jij weet ook iets: hij ruilt Westmark bij de Interhotel-bar.", e: { fu: -25, c: -4, d: -6 }, cond: S => S.flags.fuchsDirt, r: "Fuchs verbleekt. ‘We begrijpen elkaar, kameraad.’ Je hebt een vijand, maar wel een stille." },
      { t: "Kessler zelf inlichten", d: "Vlucht naar voren: geef een kleine fout toe.", e: { g: -6, d: -4, fu: 10 }, r: "Kessler luistert en zegt: ‘Eerlijkheid waardeer ik. Eén keer.’" },
      { t: "Ontkennen", d: "‘Ik weet niet waar u het over heeft.’", e: { d: 10, fu: 10 }, r: "Fuchs knikt langzaam. Een week later komt er een kopie van een interne notitie op je bureau terecht, met jouw naam erop." },
    ]
  }],
  "1988-1b": [{
    id: "springsteen", via: "gezin", title: "Bruce in Weißensee", who: "Jens, 13",
    text: "De FDJ organiseert in juli een concert van een Amerikaanse rockster op de wielerbaan in Weißensee. Honderdduizenden mensen. Jens smeekt: ‘Alle jongens uit mijn klas gaan! Ga mee, alsjeblieft?’",
    choices: [
      { t: "Mee met Jens", d: "1 mankracht minder volgende beurt.", e: { fam: 14, mk: -1 }, r: "Tussen de massa zingen 160.000 Oost-Duitsers mee met liedjes over vrijheid en wegrijden. Jens zit op je schouders. Je bent even geen officier." },
      { t: "Werken: daar zijn veel ‘elementen’", d: "Je loopt er rond met een camera.", e: { g: 4, fam: -8 }, fx: (S, A) => A.people().filter(p => p.traits.includes("punk")).forEach(p => A.know(p.id, "punk")), r: "Je fotografeert gezichten. Op een van de foto's staat, ver weg, je eigen zoon." },
    ]
  }],
  "1988-2": [{
    id: "sputnik", via: "dossier", person: "richter", title: "Het verboden tijdschrift", who: "Klaus Richter, 45, leraar geschiedenis — EOS Carl von Ossietzky",
    src: "Schooldirectie", text: "Na het verbod op het Sovjet-tijdschrift Sputnik liet Richter zijn klas een opstel schrijven over ‘perestrojka en waarheid’. Vier leerlingen hebben een kritische muurkrant opgehangen.",
    choices: [
      { t: "Gesprek met de directie, meer niet", d: "Laat de school het oplossen.", e: { g: -2, c: 2, o: 1 }, r: "Richter krijgt een berisping. De muurkrant wordt eraf gehaald.", fate: ["richter", "Gaf les tot 2010. Oud-leerlingen noemden hem ‘de enige die ons serieus nam’."] },
      { t: "Leerlingen van school, Richter ontslaan", d: "Een voorbeeld stellen.", e: { g: 10, c: -14, o: 4, res: 1 }, fx: (S, A) => { A.p("richter").job = "magazijnmedewerker"; A.pages("richter", 50); }, r: "Vier zeventienjarigen mogen geen eindexamen doen. Richter wordt magazijnmedewerker.", fate: ["richter", "Een van de verwijderde leerlingen schreef in 1990 een boek over deze week. Richter werd in 1991 gerehabiliteerd."] },
      { t: "Richter werven", d: "Een leraar ziet veel.", e: { g: 3, c: -6 }, r: "Richter weigert. Hij zegt: ‘Doe wat u moet doen.’ Je doet niets. Waarom eigenlijk niet?", fate: ["richter", "Las in 1992 dat hij had geweigerd te tekenen. Het was het enige in zijn dossier waar hij trots op was."] },
    ]
  }],
  "1989-zomer": [{
    id: "turvers", via: "dossier", title: "De turvers", who: "Burgers bij de stembureaus — gemeenteraadsverkiezingen",
    src: "Eigen waarneming", text: "Een groep burgers heeft bij stembureaus in de wijk de stemmen nageteld. Hun telling: veel meer nee-stemmen dan de officiële uitslag van 98,85% ja doet vermoeden. Ze willen een klacht indienen.",
    choices: [
      { t: "Klacht laten indienen", d: "Ze hebben het recht.", e: { g: -9, c: 6, d: 6, o: 3 }, r: "De klacht wordt ontvangen en verdwijnt in een la. Maar het nieuws gaat rond." },
      { t: "Leiders oppakken voor verhoor", d: "24 uur, geen aanklacht.", e: { g: 8, c: -10, o: 6 }, r: "Ze komen terug, en zwijgen niet. Elke 7e van de maand staan er meer mensen op de Alexanderplatz." },
      { t: "Hun tellingen in beslag nemen", d: "Geen bewijs, geen probleem.", e: { g: 5, c: -6, o: 4 }, r: "Je team neemt de schriftjes mee. Ze hebben kopieën gemaakt. Natuurlijk hebben ze dat." },
    ]
  }],
  "1989-zomerb": [{
    id: "hongarije", via: "gezin", person: "thomas", title: "Over het meer", who: "Thomas, je broer",
    cond: S => !S.flags.betray,
    text: "Thomas staat 's avonds onverwacht voor je deur. Zachtjes: ‘Hongarije heeft het hek aan de Oostenrijkse grens opengeknipt. We gaan volgende week, met de Trabi, het hele gezin. Ik vertel het je omdat je mijn broer bent.’ Een pauze. ‘Ga mee. Katrin en Jens ook.’",
    choices: [
      { t: "Hem laten gaan, niets zeggen", d: "Je hebt hem nooit gezien vanavond.", e: { c: 8, d: 10 }, fx: (S, A) => A.setStatus("thomas", "gevlucht"), r: "Twee weken later komt er een ansichtkaart uit Passau. Geen afzender. Alleen: ‘Danke.’", fate: ["thomas", "Vluchtte in augustus 1989 via Hongarije. Bouwde in Passau een ingenieursbureau op."] },
      { t: "Meegaan met je gezin", d: "Alles achterlaten. Ook jezelf.", e: { fam: 20 }, flag: "fled", r: "Je pakt één koffer. Je neemt je dienstwapen niet mee. Bij Sopron loop je met Jens aan de hand door een veld met maïs. Aan de andere kant staat een Oostenrijkse boer met thee.", fate: ["thomas", "Vluchtte samen met zijn broer, de Stasi-officier. Ze praten er nooit over."], end: true },
      { t: "Hem tegenhouden", d: "Paspoorten laten intrekken. Voor zijn eigen bestwil.", e: { g: 8, c: -15, fam: -15 }, fx: (S, A) => { A.pages("thomas", 20); }, flag: "betray", r: "Bij de grens van Tsjecho-Slowakije wordt Thomas teruggestuurd. Hij weet niet zeker dat jij het was. Hij vermoedt het wel.", fate: ["thomas", "Bleef in de DDR tot de muur viel. Vroeg in 1992 zijn dossier op en vond daarin zijn broer."] },
    ]
  }],
  "1989-oktb": [{
    id: "nf", via: "dossier", person: "jutta", title: "Een handtekening", who: "Jutta Lang, 38, architecte",
    src: "IM-rapportage", text: "Lang heeft de oprichtingsoproep van een nieuwe burgerbeweging getekend en verspreidt kopieën in Café Mosaik. Duizenden mensen zijn via Hongarije vertrokken; in Leipzig wordt elke maandag gedemonstreerd.", note: "Iedereen op kantoor voelt het. Er verandert iets.",
    choices: [
      { t: "Niets doen", d: "Je kunt de zee niet tegenhouden.", e: { g: -6, c: 4, o: 3 }, r: "Je dossier over Lang blijft dun. Het kantoor is te druk met paniek om het te merken.", fate: ["jutta", "Ontwierp na de Wende een school in Pankow."] },
      { t: "Observatie, 24 uur per dag", d: "Kessler wil namen.", e: { g: 6, c: -6, o: 2 }, fx: (S, A) => A.pages("jutta", 30), r: "Twee mannen in een grijze Wartburg voor haar deur. Ze zwaait elke ochtend naar ze.", fate: ["jutta", "Hing in 1992 een kopie van haar observatierapport in haar keuken: ‘Zwaait naar de auto. Provocerend.’"] },
      { t: "Op de lijst voor ‘Tag X’", d: "Interneringskampen, mocht het nodig zijn.", e: { g: 10, c: -12 }, fx: (S, A) => A.pages("jutta", 25), r: "Haar naam komt op de lijst voor internering. Mocht het ooit nodig zijn.", fate: ["jutta", "Vond in 1992 haar naam op een interneringslijst. Ze had het altijd voor overdreven geruchten gehouden."] },
    ]
  }],
  "1989-okt": [{
    id: "zeven", via: "telefoon", title: "Veertig jaar DDR", who: "Major Kessler — gespannen",
    text: "‘Gorbatsjov is in de stad. Bij het Palast der Republik roepen ze zijn naam. Vanavond grijpen we in bij de Gethsemanekirche. U selecteert uit uw wijk wie er wordt opgepakt.’",
    choices: [
      { t: "Een lange lijst maken", d: "Iedereen uit je dossiers.", e: { g: 10, c: -15, o: 8 }, fx: (S, A) => A.people().filter(p => p.status === "vrij" && p.pages >= 15).forEach(p => { A.log(p.id, "Opgepakt op 7 oktober 1989"); A.pages(p.id, 10); }), r: "Honderden mensen worden die nacht opgepakt. Sommigen worden geslagen. De beelden gaan de wereld over." },
      { t: "Een korte lijst maken", d: "Alleen de ‘leiders’.", e: { g: 3, c: -4, o: 4 }, r: "Je kiest zo weinig mogelijk namen. Het helpt een beetje. Niet genoeg." },
      { t: "Weigeren", d: "‘Ik doe dit niet, Genosse Major.’", e: { g: -25, c: 15, d: 20 }, flag: "refuse", r: "Stilte. Kessler zegt alleen: ‘Ga naar huis.’ Twee dagen later demonstreren in Leipzig 70.000 mensen. Er wordt niet geschoten." },
    ]
  }],
  "1989-nov": [{
    id: "muur", via: "telefoon", title: "De muur", who: "Kreisdienststelle, avond",
    text: "Op de radio zegt een woordvoerder van het Politbüro iets verwards over reizen ‘per direct, onverwijld’. Om middernacht staan duizenden mensen bij de Bornholmer Straße. De muur is open.\n\nIn de gang draaien de versnipperaars. Kessler zegt: ‘Alles waar namen in staan. Vannacht.’",
    choices: [
      { t: "Versnipperen", d: "Bescherm het netwerk. En jezelf.", e: { c: -10, d: -30 }, flag: "shred", r: "Je werkt tot de machines oververhit raken. Daarna scheur je met de hand.", end: true },
      { t: "Dossiers laten liggen", d: "Laat de mensen ooit lezen wat er gebeurd is.", e: { c: 12 }, flag: "keep", r: "Je zet de dozen terug in de kast en loopt naar buiten. Op straat omhelzen vreemden elkaar.", end: true },
      { t: "Naar de Bornholmer Straße", d: "Kijken. Gewoon kijken.", e: { c: 6, fam: 10 }, flag: "walk", r: "Je loopt mee in de menigte, met je dienstpas diep in je zak. Iemand duwt je een fles sekt in handen. Aan de andere kant klappen mensen.", end: true },
    ]
  }],
};

// Voorwaardelijke en losse gebeurtenissen, getest elke beurt (eenmalig tenzij repeat)
export const CONDITIONAL = [
  {
    id: "dirt", via: "dossier", title: "In de Interhotel-bar", who: "Eigen waarneming",
    cond: (S, t) => t >= 13 && S.fuchs >= 20 && !S.flags.fuchsDirt, chance: 0.5,
    text: "Je ziet Oberleutnant Fuchs in de bar van het Interhotel. Hij schuift een envelop met Westmark naar een man met een Rolex.",
    choices: [
      { t: "Onthouden", d: "Dit kan nog van pas komen.", e: {}, flag: "fuchsDirt", r: "Je schrijft datum en tijd op een sigarettenpakje." },
      { t: "Meteen melden", d: "Hij is je rivaal.", e: { g: 6, fu: 40 }, flag: "fuchsDirt", r: "Kessler leest je melding en zegt: ‘Interessant.’ Fuchs wordt een week geschorst. Hij weet wie het was." },
    ]
  },
  {
    id: "nachtmerrie", via: "gezin", title: "Drie uur 's nachts", who: "Thuis",
    cond: S => S.geweten < 25,
    text: "Je wordt wakker. Katrin zegt dat je in je slaap namen riep. Namen die zij niet kent.",
    choices: [
      { t: "‘Het is niets. Slaap verder.’", d: "", e: { fam: -6 }, r: "Ze draait zich om. Jij ligt tot de ochtend wakker." },
      { t: "Een glas schnaps", d: "", e: { fam: -3, c: 2 }, r: "Het helpt even. Het helpt nooit lang." },
    ]
  },
  {
    id: "onderzoek", via: "telefoon", title: "Hauptabteilung Kader", who: "Een man die je niet kent",
    cond: S => S.dossier >= 60,
    text: "‘Leutnant, de afdeling personeelszaken heeft enkele vragen. Routine. Uw broer. Uw contacten. Een lek in 1987. We spreken elkaar nog.’",
    choices: [
      { t: "Extra ijver tonen", d: "Een paar snelle resultaten. Koste wat kost.", e: { g: 6, c: -8, d: -8 }, r: "Je werkt drie weken lang zeven dagen per week. Het onderzoek wordt ‘voorlopig’ geschorst." },
      { t: "Kalm blijven", d: "Ze hebben niets.", e: { d: 4 }, r: "De man knikt en vertrekt. Je ziet hem later nog twee keer op de gang." },
    ]
  },
  {
    id: "katrinweg", via: "gezin", title: "Een leeg bed", who: "Katrin",
    cond: S => S.gezin < 20,
    text: "Als je thuiskomt staat er een tas bij de deur. Katrin: ‘Ik ga met Jens een tijd naar mijn moeder in Rostock. Je bent hier toch nooit. En als je er bent, ben je er niet.’",
    choices: [
      { t: "Smeken om te blijven", d: "Je belooft minder te werken.", e: { fam: 20, mk: -2, g: -3 }, r: "Ze blijft. Voorlopig. ‘Laat het me zien,’ zegt ze." },
      { t: "Laten gaan", d: "", e: { fam: -10, c: -3 }, flag: "alone", r: "De deur valt dicht. In de flat is het stil, op het getik van de kachel na." },
    ]
  },
  {
    id: "trabant", via: "gezin", title: "De Trabant", who: "Brief van het IFA-verkooppunt",
    cond: (S, t) => S.gunst >= 70 && t >= 8,
    text: "Na elf jaar wachten, versneld dankzij ‘bijzondere verdiensten’: je Trabant 601 staat klaar. Kleur: papyruswit.",
    choices: [{ t: "Ophalen", d: "", e: { fam: 10 }, r: "Jens mag toeteren. De buren kijken. Herr Pohl schrijft iets op, maar dat zie je niet." }]
  },
  {
    id: "westpakket", via: "dossier", title: "Een Westpakket", who: "Afdeling M (postcontrole)",
    cond: (S, t) => t >= 3, chance: 0.25,
    text: "Een pakket uit Keulen voor een bewoner van je wijk: koffie, panty's, chocola en een boek van een verboden schrijver. Je collega's van de postafdeling vragen wat ermee moet.",
    choices: [
      { t: "Doorsturen, boek eruit", d: "", e: { g: 1 }, r: "Het pakket komt aan, een beetje lichter." },
      { t: "Koffie en chocola voor de afdeling", d: "Iedereen doet het.", e: { c: -3, g: 2 }, r: "De koffie is heerlijk. De ontvanger schrijft een klacht. Die belandt op jouw bureau." },
      { t: "Alles doorsturen", d: "Ook het boek.", e: { c: 3, d: 3 }, r: "Ergens in Prenzlauer Berg wordt een boek gelezen dat er niet hoort te zijn." },
    ]
  },
  {
    id: "imstop", via: "dossier", title: "Een IM wil stoppen", who: "Ontmoeting in een konspirative Wohnung",
    cond: S => S.people.some(p => p.status === "im"), chance: 0.2, repeat: true,
    text: "", // dynamisch
    dyn: (S, A) => { const im = A.rand(S.people.filter(p => p.status === "im")); return { pid: im.id, text: `IM „${im.code}“ (${im.name}) zit trillend tegenover je. ‘Ik kan dit niet meer. Mijn buren kijken me raar aan. Laat me stoppen.’` }; },
    choices: [
      { t: "Laten gaan", d: "Je verliest een IM.", e: { c: 4, g: -2 }, fx: (S, A, ctx) => { A.setStatus(ctx.pid, "vrij"); A.log(ctx.pid, "Mocht stoppen als IM"); }, r: "{Z} loopt opgelucht de deur uit en kijkt niet om." },
      { t: "Dreigen", d: "‘Wilt u dat uw buren weten dát u IM bent?’", e: { c: -7 }, fx: (S, A, ctx) => { const p = A.p(ctx.pid); p.honesty = Math.max(10, p.honesty - 25); }, r: "{Z} blijft. Maar de rapporten worden korter, en vager." },
    ]
  },
];
