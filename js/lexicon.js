// ===================== HANDBOEK: wat mocht wel/niet in de DDR + kroniek (fase 3C) =====================
// Korte, controleerbare uitleg. De kroniek toont alleen beurten die al geweest zijn (geen spoilers).

// Regels: ok = toegestaan, grey = toegestaan maar riskant/ongewenst, no = strafbaar
export const RULES = [
  { cat: "Media", items: [
    ["grey", "Watching West German TV, listening to RIAS", "Not a crime. In the 1950s and 60s FDJ groups even turned aerials away from the West. By the 1970s it was tolerated; almost everyone watched. But talking about it at school or at work could go into a file, and children were asked in class what the clock on the TV news looked like."],
    ["no", "Spreading Western publications", "Bringing in or passing on banned books, magazines or leaflets could count as ‘Staatsfeindliche Hetze’ (§106, agitation hostile to the state) or ‘Öffentliche Herabwürdigung’ (§220, publicly disparaging the state). Typing samizdat yourself was the same."],
    ["grey", "Owning a typewriter or a duplicator", "A typewriter was allowed. Copying machines were registered and controlled; a church duplicator was legal for church use only. That is why the Ministry analysed typefaces."],
  ] },
  { cat: "Speaking out", items: [
    ["ok", "Writing an Eingabe (petition)", "Every citizen had the right to send complaints and petitions to the authorities, and many did: about flats, heating, cars. A complaint about the system itself was treated very differently."],
    ["no", "Criticising the state in public", "Jokes about the leadership were common in private. Said loudly in the canteen, or written on a wall, they could lead to a warning interview, a lost job or §220."],
    ["grey", "Church gatherings and peace groups", "Religion was allowed, and the Protestant church was the only large organisation not run by the Party. Inside church buildings, groups could meet. Once they went out on the street, they were arrested."],
    ["no", "Contact with Western organisations", "‘Ungesetzliche Verbindungsaufnahme’ (§219): passing information to Western journalists or groups that could ‘harm the interests of the GDR’."],
  ] },
  { cat: "Travel and leaving", items: [
    ["ok", "Travel to Hungary, Bulgaria, Czechoslovakia", "Holidays in the socialist countries were possible. Lake Balaton was where East and West German families met. Travel to Poland was restricted after 1980."],
    ["grey", "Travel to the West", "Only for pensioners, and for others on urgent family business such as a funeral or a wedding, after a long application. The family usually had to stay behind as a guarantee."],
    ["grey", "Applying to leave (Ausreiseantrag)", "From 1983 there was a narrow legal route for family reunification. Many applied anyway. Applicants often lost their jobs or university places and were watched closely. Some waited years, some were suddenly let go."],
    ["no", "Leaving without permission", "‘Ungesetzlicher Grenzübertritt’ (§213), called ‘Republikflucht’. Up to eight years in prison for serious cases. Talking about it with others could already count as preparation."],
  ] },
  { cat: "Money and goods", items: [
    ["ok", "Owning West marks", "From 1974 citizens were allowed to own Deutschmarks and spend them in the Intershop. Most of it came from relatives in the West."],
    ["no", "Swapping currency on the black market", "Exchanging marks privately, at four to ten East marks to one, was illegal. It happened anyway, especially for car parts, building materials and tradesmen."],
    ["ok", "Receiving a Westpaket", "Parcels from the West were allowed, and millions arrived every year: coffee, chocolate, tights, jeans. Postal control (Abteilung M) opened a share of them and sometimes kept things."],
    ["grey", "Bückware", "Goods kept ‘under the counter’ for regular customers or friends. Not exactly legal, never quite punished. You had to bend down (bücken) to get them."],
  ] },
  { cat: "Daily life", items: [
    ["ok", "Registering visitors in the Hausbuch", "A duty, not a choice: visitors who stayed for several days had to be entered in the building's Hausbuch. Western visitors had to be registered with the police as well."],
    ["grey", "Refusing military service", "There was no right to refuse. From 1964 you could serve as a Bausoldat, building without weapons. That counted against you for university for the rest of your life."],
    ["grey", "Being a punk", "Not illegal in itself. But ‘Rowdytum’ (§215) and ‘asoziales Verhalten’ (§249, ‘work-shy’ behaviour) could be used against anyone who looked or lived differently."],
    ["ok", "Subbotnik, FDJ, Jugendweihe", "‘Voluntary’ in name. Not joining the FDJ, skipping the Jugendweihe for confirmation, or missing the Subbotnik was not a crime. It could close doors to the EOS, to university, to a better job."],
  ] },
];

// Kroniek: achtergrond per beurt. Bronnen in ROADMAP.md (fase 3).
export const CHRONICLE = {
  "1983-mrt": ["Karl Marx Year and Luther Year", "In 1983 the GDR celebrated both the 100th anniversary of Marx's death and the 500th birthday of Martin Luther. Honoring the reformer was new: the state hoped to gain the church's goodwill, and Western visitors."],
  "1983-jun": ["The billion-mark loan", "Bonn guaranteed a loan of a billion Deutschmarks to the indebted GDR. The deal was brokered by Franz Josef Strauß, a fierce anti-communist. In return the GDR began removing automatic firing devices from the border."],
  "1983-sep": ["Swords into ploughshares", "‘Schwerter zu Pflugscharen’, a Bible verse and the image of a Soviet statue at the UN, became the badge of the independent peace movement. Schools ordered pupils to cut it off their jackets. On 24 September 1983, at the church congress in Wittenberg, a smith reforged a real sword."],
  "1983-dec": ["Frauen für den Frieden", "Bärbel Bohley and Ulrike Poppe of the group Women for Peace were arrested on 12 December 1983 for contacts with Western peace activists. After protests at home and abroad they were released six weeks later."],
  "1984-mrt": ["The exit wave of 1984", "From early 1984 the GDR suddenly let tens of thousands of exit applicants go, around 40,000 that year. It hoped to get rid of its malcontents. Instead, many more people applied."],
  "1984-jun": ["The Permanent Mission", "West Germany had no embassy in East Berlin but a ‘Permanent Mission’. In 1984 East Germans sat in the building to force their way out. Bonn closed it to visitors from 27 June to 31 July."],
  "1985-mrt": ["Gorbachev", "On 11 March 1985 Mikhail Gorbachev became General Secretary in Moscow. His words glasnost (openness) and perestroika (rebuilding) gave hope to many East Germans. The SED leadership kept its distance."],
  "1986-mei": ["Chernobyl", "On 26 April 1986 a reactor exploded at Chernobyl in Ukraine. GDR media reported it late and briefly. West German TV warned against fresh vegetables; in East Berlin, lettuce that the West refused to buy was suddenly cheap."],
  "1986-sep": ["The Umwelt-Bibliothek", "On 2 September 1986 activists opened an environmental library in the cellar of the Zion parish in Prenzlauer Berg. It became a meeting place for the opposition, with its own newsletter, the Umweltblätter."],
  "1987-jun": ["‘Die Mauer muss weg!’", "From 6 to 8 June 1987 Western bands played near the Reichstag, loudspeakers partly facing east. Thousands of young East Berliners gathered on Unter den Linden and chanted against the Wall. The police struck. On 12 June Reagan spoke at the Brandenburg Gate."],
  "1987-sep": ["Honecker in Bonn", "From 7 to 11 September 1987 Erich Honecker visited West Germany with full state honours. At the same time the Olof Palme peace march crossed the GDR, and church groups were allowed to walk with their own banners."],
  "1987-okt": ["Skinheads in the Zionskirche", "On 17 October 1987, after a concert, around thirty skinheads attacked visitors of the Zionskirche. Officially the GDR had no neo-Nazis. The light sentences at the first trial caused protests; on appeal they were raised."],
  "1987-nov": ["Aktion ‘Falle’", "In the night of 24 to 25 November 1987 the Ministry raided the Umwelt-Bibliothek and arrested people printing there. The result was the opposite of what was intended: nightly vigils, and solidarity across the country."],
  "1988-jan": ["‘Freedom of those who think differently’", "At the official march for Liebknecht and Luxemburg on 17 January 1988, activists wanted to carry Rosa Luxemburg's own words on a banner. Over a hundred people were arrested; several were later forced to leave for the West."],
  "1988-jul": ["Springsteen in Weißensee", "On 19 July 1988 Bruce Springsteen played to well over 160,000 people at the cycling track in Weißensee, organised by the FDJ. It was the largest concert in the history of the GDR."],
  "1988-nov": ["Sputnik banned", "On 19 November 1988 the Soviet digest Sputnik was struck off the postal list: too much glasnost. That autumn pupils of the Carl von Ossietzky school in Pankow were expelled over a wall newspaper criticising military parades."],
  "1989-feb": ["Chris Gueffroy", "On 5 February 1989, twenty-year-old Chris Gueffroy was shot dead at the Britzer Zweigkanal. He was the last person killed by shots at the Berlin Wall. A death notice appeared in the Berliner Zeitung on 21 February."],
  "1989-mei": ["The rigged election", "At the local elections of 7 May 1989 citizens counted the votes in polling stations. The official result was 98.85% yes. The counters found far more no votes and proved the fraud. From then on there were protests on the 7th of every month."],
  "1989-aug": ["The Pan-European picnic", "Hungary began dismantling its border fence on 2 May 1989. At a picnic near Sopron on 19 August, several hundred East Germans walked through a gate into Austria."],
  "1989-sep": ["Neues Forum, Hungary opens", "On 9 and 10 September 1989 the citizens' movement Neues Forum was founded. On 11 September Hungary opened its border to GDR citizens. Tens of thousands left within weeks."],
  "1989-okt": ["Forty years of the GDR", "On 6 and 7 October 1989 the state celebrated its 40th anniversary with Gorbachev as guest. That night police and Stasi beat and arrested demonstrators near the Gethsemanekirche. On 9 October 70,000 marched in Leipzig, and nobody shot."],
  "1989-nov4": ["Alexanderplatz", "On 4 November 1989 hundreds of thousands gathered on Alexanderplatz for a demonstration approved by the authorities, broadcast live on GDR television. Honecker had resigned on 18 October."],
  "1989-nov": ["The Wall opens", "On the evening of 9 November 1989 Politbüro member Günter Schabowski read out new travel rules at a press conference: valid ‘immediately’. Crowds went to the crossings. At Bornholmer Straße the barrier went up at about half past eleven."],
};
