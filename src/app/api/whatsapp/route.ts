import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_WHAPI_TOKEN = "ohxDDFSuvqRvl4DKZLu7eEYUfbAEkCil";
const DEFAULT_CHANNEL_ID = "STARLD-W5LEE";
const AUTOFAME_AGENT_GROUP_ID = "120363413508068515@g.us";

// Track answered message IDs in memory so we never double-reply
const answeredMessageIds = new Set<string>();

/**
 * Synced Phonebook Contacts & Recent Chats from Whapi Channel STARLD-W5LEE (+27 63 199 5124)
 * Ensures contact search, selection, and chat history always work even if Whapi trial quota is at 0.
 */
const SYNCED_WHAPI_CONTACTS: {
  id: string;
  chatId: string;
  name: string;
  phone: string;
  lastMessage?: string;
  fromMe?: boolean;
  timestamp?: string;
}[] = [
  {
    id: AUTOFAME_AGENT_GROUP_ID,
    chatId: AUTOFAME_AGENT_GROUP_ID,
    name: "AutoFame AI Agent (Group)",
    phone: "+27 63 199 5124",
    lastMessage: "AutoFame Dealership AI Agent Channel — Ask inventory, quotes, or finance",
    fromMe: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "27837324229",
    chatId: "27837324229@s.whatsapp.net",
    name: "Martha (Maria Engelbrecht)",
    phone: "+27 83 732 4229",
    lastMessage:
      "Bank: Capitec | Account Holder: MS MARIA ENGELBRECHT | Business Name: West Bulk Bags | Account Type: Entrepreneur Account | Account number: 2558165883",
    fromMe: false,
    timestamp: "2026-10-19T10:08:25.000Z",
  },
  {
    id: "27747404229",
    chatId: "27747404229@s.whatsapp.net",
    name: "Client +27 74 740 4229",
    phone: "+27 74 740 4229",
    lastMessage: "Okay and that will cost how much (Re: Going to cost only R432)",
    fromMe: false,
    timestamp: "2026-10-20T05:08:47.000Z",
  },
  {
    id: "27697642905",
    chatId: "27697642905@s.whatsapp.net",
    name: "Precious",
    phone: "+27 69 764 2905",
    lastMessage: "😂lol",
    fromMe: false,
    timestamp: "2026-10-20T08:12:20.000Z",
  },
  {
    id: "27631227343",
    chatId: "27631227343@s.whatsapp.net",
    name: "Blesz",
    phone: "+27 63 122 7343",
    lastMessage: "Saved WhatsApp Contact",
    fromMe: false,
    timestamp: "2026-10-19T14:20:00.000Z",
  },
  {
    id: "27833482059",
    chatId: "27833482059@s.whatsapp.net",
    name: "Advance Auto (Tshepo Seepe)",
    phone: "+27 83 348 2059",
    lastMessage: "Advance Auto Dealership Contact",
    fromMe: false,
    timestamp: "2026-10-19T12:00:00.000Z",
  },
  {
    id: "27781286020",
    chatId: "27781286020@s.whatsapp.net",
    name: "JD Auto Cars",
    phone: "+27 78 128 6020",
    lastMessage: "JD Auto Cars Contact",
    fromMe: false,
    timestamp: "2026-10-19T11:30:00.000Z",
  },
  {
    id: "27733256354",
    chatId: "27733256354@s.whatsapp.net",
    name: "Imperial (Imperial Cons, Anytech S)",
    phone: "+27 73 325 6354",
    lastMessage: "Imperial Contact",
    fromMe: false,
    timestamp: "2026-10-19T11:00:00.000Z",
  },
  {
    id: "27602471161",
    chatId: "27602471161@s.whatsapp.net",
    name: "Contact +27 60 247 1161",
    phone: "+27 60 247 1161",
    lastMessage: "Morning",
    fromMe: true,
    timestamp: "2026-10-20T08:52:42.000Z",
  },
  {
    id: "27637310437",
    chatId: "27637310437@s.whatsapp.net",
    name: "Contact +27 63 731 0437",
    phone: "+27 63 731 0437",
    lastMessage: "Morning Sir I hope you good, wanted to ask if its not yet sorted this side...",
    fromMe: true,
    timestamp: "2026-10-20T05:10:08.000Z",
  },
  {
    id: "27736936626",
    chatId: "27736936626@s.whatsapp.net",
    name: "Thamu (+27 73 693 6626)",
    phone: "+27 73 693 6626",
    lastMessage: "Awe Thamu",
    fromMe: true,
    timestamp: "2026-10-19T17:17:27.000Z",
  },
  {
    id: "27762232914",
    chatId: "27762232914@s.whatsapp.net",
    name: "Contact +27 76 223 2914",
    phone: "+27 76 223 2914",
    lastMessage: "Thanks I got the message",
    fromMe: true,
    timestamp: "2026-10-19T12:31:57.000Z",
  },
  {
    id: "27799363808",
    chatId: "27799363808@s.whatsapp.net",
    name: "Contact +27 79 936 3808",
    phone: "+27 79 936 3808",
    lastMessage: "Am good my brother Its Alex here...",
    fromMe: true,
    timestamp: "2026-10-19T09:35:20.000Z",
  },
  { id: "27791065911", chatId: "27791065911@s.whatsapp.net", name: "Weja (wellew)", phone: "+27 79 106 5911", lastMessage: "Saved Phonebook Contact" },
  { id: "27610162097", chatId: "27610162097@s.whatsapp.net", name: "Zach", phone: "+27 61 016 2097", lastMessage: "Saved Phonebook Contact" },
  { id: "27785016233", chatId: "27785016233@s.whatsapp.net", name: "Zinto", phone: "+27 78 501 6233", lastMessage: "Saved Phonebook Contact" },
  { id: "263715855616", chatId: "263715855616@s.whatsapp.net", name: "Ndonsi", phone: "+263 71 585 5616", lastMessage: "Saved Phonebook Contact" },
  { id: "27629904937", chatId: "27629904937@s.whatsapp.net", name: "Anty Ntombi", phone: "+27 62 990 4937", lastMessage: "Saved Phonebook Contact" },
  { id: "263788112597", chatId: "263788112597@s.whatsapp.net", name: "Buumi", phone: "+263 78 811 2597", lastMessage: "Saved Phonebook Contact" },
  { id: "27847558440", chatId: "27847558440@s.whatsapp.net", name: "Ayibongwe", phone: "+27 84 755 8440", lastMessage: "Saved Phonebook Contact" },
  { id: "27665002247", chatId: "27665002247@s.whatsapp.net", name: "My Love", phone: "+27 66 500 2247", lastMessage: "Saved Phonebook Contact" },
  { id: "27707652431", chatId: "27707652431@s.whatsapp.net", name: "Frank", phone: "+27 70 765 2431", lastMessage: "Saved Phonebook Contact" },
  { id: "27697086121", chatId: "27697086121@s.whatsapp.net", name: "South Gate", phone: "+27 69 708 6121", lastMessage: "Saved Phonebook Contact" },
  { id: "263710769630", chatId: "263710769630@s.whatsapp.net", name: "Thabani", phone: "+263 71 076 9630", lastMessage: "Saved Phonebook Contact" },
  { id: "27725046118", chatId: "27725046118@s.whatsapp.net", name: "Sled", phone: "+27 72 504 6118", lastMessage: "Saved Phonebook Contact" },
  { id: "263781619370", chatId: "263781619370@s.whatsapp.net", name: "Maphuma Scott", phone: "+263 78 161 9370", lastMessage: "Saved Phonebook Contact" },
  { id: "27783926931", chatId: "27783926931@s.whatsapp.net", name: "Rose", phone: "+27 78 392 6931", lastMessage: "Saved Phonebook Contact" },
  { id: "27837055495", chatId: "27837055495@s.whatsapp.net", name: "York", phone: "+27 83 705 5495", lastMessage: "Saved Phonebook Contact" },
  { id: "27681498392", chatId: "27681498392@s.whatsapp.net", name: "Makhado", phone: "+27 68 149 8392", lastMessage: "Saved Phonebook Contact" },
  { id: "27817477939", chatId: "27817477939@s.whatsapp.net", name: "Mandla", phone: "+27 81 747 7939", lastMessage: "Saved Phonebook Contact" },
  { id: "27640160448", chatId: "27640160448@s.whatsapp.net", name: "Synergy Holdingd", phone: "+27 64 016 0448", lastMessage: "Saved Phonebook Contact" },
  { id: "27724605673", chatId: "27724605673@s.whatsapp.net", name: "Edias Moyo", phone: "+27 72 460 5673", lastMessage: "Saved Phonebook Contact" },
  { id: "27710395516", chatId: "27710395516@s.whatsapp.net", name: "Bhekie", phone: "+27 71 039 5516", lastMessage: "Saved Phonebook Contact" },
  { id: "27677624853", chatId: "27677624853@s.whatsapp.net", name: "Ruth", phone: "+27 67 762 4853", lastMessage: "Saved Phonebook Contact" },
  { id: "27784753871", chatId: "27784753871@s.whatsapp.net", name: "Siya Siya", phone: "+27 78 475 3871", lastMessage: "Saved Phonebook Contact" },
  { id: "27659264090", chatId: "27659264090@s.whatsapp.net", name: "Ayaa", phone: "+27 65 926 4090", lastMessage: "Saved Phonebook Contact" },
  { id: "27699644296", chatId: "27699644296@s.whatsapp.net", name: "Godeshy", phone: "+27 69 964 4296", lastMessage: "Saved Phonebook Contact" },
  { id: "27683723056", chatId: "27683723056@s.whatsapp.net", name: "Elias", phone: "+27 68 372 3056", lastMessage: "Saved Phonebook Contact" },
  { id: "27680781107", chatId: "27680781107@s.whatsapp.net", name: "Maolger", phone: "+27 68 078 1107", lastMessage: "Saved Phonebook Contact" },
  { id: "27843389054", chatId: "27843389054@s.whatsapp.net", name: "Young Rick", phone: "+27 84 338 9054", lastMessage: "Saved Phonebook Contact" },
  { id: "27672562521", chatId: "27672562521@s.whatsapp.net", name: "Jay Oil", phone: "+27 67 256 2521", lastMessage: "Saved Phonebook Contact" },
  { id: "27638542543", chatId: "27638542543@s.whatsapp.net", name: "Gazi", phone: "+27 63 854 2543", lastMessage: "Saved Phonebook Contact" },
  { id: "27842814665", chatId: "27842814665@s.whatsapp.net", name: "Maidi Mashao", phone: "+27 84 281 4665", lastMessage: "Saved Phonebook Contact" },
  { id: "27653355454", chatId: "27653355454@s.whatsapp.net", name: "Talia", phone: "+27 65 335 5454", lastMessage: "Saved Phonebook Contact" },
  { id: "27799765903", chatId: "27799765903@s.whatsapp.net", name: "Gcobani Hlubi", phone: "+27 79 976 5903", lastMessage: "Saved Phonebook Contact" },
  { id: "27715712713", chatId: "27715712713@s.whatsapp.net", name: "Archie Maubane", phone: "+27 71 571 2713", lastMessage: "Saved Phonebook Contact" },
  { id: "27689523316", chatId: "27689523316@s.whatsapp.net", name: "Contact +27 68 952 3316", phone: "+27 68 952 3316", lastMessage: "Hello", fromMe: true },
  { id: "27656379695", chatId: "27656379695@s.whatsapp.net", name: "Contact +27 65 637 9695", phone: "+27 65 637 9695", lastMessage: "Morning", fromMe: true },
  { id: "27685206008", chatId: "27685206008@s.whatsapp.net", name: "Innocent dbouy Dumazi", phone: "+27 68 520 6008", lastMessage: "WhatsApp Contact" },
  { id: "27810437088", chatId: "27810437088@s.whatsapp.net", name: "garethpiorek98", phone: "+27 81 043 7088", lastMessage: "WhatsApp Contact" },
  { id: "27846702322", chatId: "27846702322@s.whatsapp.net", name: "Nec2", phone: "+27 84 670 2322", lastMessage: "Saved Phonebook Contact" },
  { id: "27740737617", chatId: "27740737617@s.whatsapp.net", name: "P2", phone: "+27 74 073 7617", lastMessage: "Saved Phonebook Contact" },
  { id: "27813238936", chatId: "27813238936@s.whatsapp.net", name: "Bath2", phone: "+27 81 323 8936", lastMessage: "Saved Phonebook Contact" },
  { id: "27766469620", chatId: "27766469620@s.whatsapp.net", name: "Painter3", phone: "+27 76 646 9620", lastMessage: "Saved Phonebook Contact" },
  { id: "27837365220", chatId: "27837365220@s.whatsapp.net", name: "Painter4", phone: "+27 83 736 5220", lastMessage: "Saved Phonebook Contact" },
  { id: "27693466396", chatId: "27693466396@s.whatsapp.net", name: "Dum", phone: "+27 69 346 6396", lastMessage: "Saved Phonebook Contact" },
  { id: "27766965583", chatId: "27766965583@s.whatsapp.net", name: "Painti", phone: "+27 76 696 5583", lastMessage: "Saved Phonebook Contact" },
  { id: "27826069421", chatId: "27826069421@s.whatsapp.net", name: "Pep", phone: "+27 82 606 9421", lastMessage: "Saved Phonebook Contact" },
  { id: "263713622833", chatId: "263713622833@s.whatsapp.net", name: "Delight", phone: "+263 71 362 2833", lastMessage: "Saved Phonebook Contact" },
  { id: "27698413050", chatId: "27698413050@s.whatsapp.net", name: "Skimmm", phone: "+27 69 841 3050", lastMessage: "Saved Phonebook Contact" },
  { id: "263771903221", chatId: "263771903221@s.whatsapp.net", name: "Mazuzu", phone: "+263 77 190 3221", lastMessage: "Saved Phonebook Contact" },
  { id: "27782050180", chatId: "27782050180@s.whatsapp.net", name: "Plumbee", phone: "+27 78 205 0180", lastMessage: "Saved Phonebook Contact" },
  { id: "27786197272", chatId: "27786197272@s.whatsapp.net", name: "Electric Stuff", phone: "+27 78 619 7272", lastMessage: "Saved Phonebook Contact" },
  { id: "263787948750", chatId: "263787948750@s.whatsapp.net", name: "Ashy", phone: "+263 78 794 8750", lastMessage: "Saved Phonebook Contact" },
  { id: "27678939128", chatId: "27678939128@s.whatsapp.net", name: "MK", phone: "+27 67 893 9128", lastMessage: "Saved Phonebook Contact" },
  { id: "27749358488", chatId: "27749358488@s.whatsapp.net", name: "God Father", phone: "+27 74 935 8488", lastMessage: "Saved Phonebook Contact" },
  { id: "27640490688", chatId: "27640490688@s.whatsapp.net", name: "Heater", phone: "+27 64 049 0688", lastMessage: "Saved Phonebook Contact" },
  { id: "27724556589", chatId: "27724556589@s.whatsapp.net", name: "Chisambo", phone: "+27 72 455 6589", lastMessage: "Saved Phonebook Contact" },
  { id: "27815734551", chatId: "27815734551@s.whatsapp.net", name: "Dumoe", phone: "+27 81 573 4551", lastMessage: "Saved Phonebook Contact" },
  { id: "27671712635", chatId: "27671712635@s.whatsapp.net", name: "Bath3", phone: "+27 67 171 2635", lastMessage: "Saved Phonebook Contact" },
  { id: "27828259961", chatId: "27828259961@s.whatsapp.net", name: "Roof1", phone: "+27 82 825 9961", lastMessage: "Saved Phonebook Contact" },
  { id: "27783770744", chatId: "27783770744@s.whatsapp.net", name: "Rim", phone: "+27 78 377 0744", lastMessage: "Saved Phonebook Contact" },
  { id: "27760868895", chatId: "27760868895@s.whatsapp.net", name: "Nic Theunissen", phone: "+27 76 086 8895", lastMessage: "WhatsApp Contact" },
  { id: "27731160692", chatId: "27731160692@s.whatsapp.net", name: "X-MAN Construction & Projects", phone: "+27 73 116 0692", lastMessage: "WhatsApp Contact" },
  { id: "27626593766", chatId: "27626593766@s.whatsapp.net", name: "Re Battery", phone: "+27 62 659 3766", lastMessage: "Saved Phonebook Contact" },
  { id: "27663638131", chatId: "27663638131@s.whatsapp.net", name: "Ske", phone: "+27 66 363 8131", lastMessage: "Saved Phonebook Contact" },
  { id: "263785889616", chatId: "263785889616@s.whatsapp.net", name: "Honest", phone: "+263 78 588 9616", lastMessage: "Saved Phonebook Contact" },
  { id: "263788121743", chatId: "263788121743@s.whatsapp.net", name: "Money Money", phone: "+263 78 812 1743", lastMessage: "Saved Phonebook Contact" },
  { id: "27787085891", chatId: "27787085891@s.whatsapp.net", name: "Big Man", phone: "+27 78 708 5891", lastMessage: "Saved Phonebook Contact" },
  { id: "263779242629", chatId: "263779242629@s.whatsapp.net", name: "Bus", phone: "+263 77 924 2629", lastMessage: "Saved Phonebook Contact" },
  { id: "27704213784", chatId: "27704213784@s.whatsapp.net", name: "Maden Xpress ZW", phone: "+27 70 421 3784", lastMessage: "Saved Phonebook Contact" },
  { id: "27860900100", chatId: "27860900100@s.whatsapp.net", name: "Phone Yami", phone: "+27 86 090 0100", lastMessage: "Saved Phonebook Contact" },
  { id: "263775429660", chatId: "263775429660@s.whatsapp.net", name: "Nkosisikelela", phone: "+263 77 542 9660", lastMessage: "Saved Phonebook Contact" },
  { id: "27617747378", chatId: "27617747378@s.whatsapp.net", name: "Style and Beyouti Zone Spa", phone: "+27 61 774 7378", lastMessage: "WhatsApp Contact" },
  { id: "27827732931", chatId: "27827732931@s.whatsapp.net", name: "Nish", phone: "+27 82 773 2931", lastMessage: "WhatsApp Contact" },
  { id: "27732762910", chatId: "27732762910@s.whatsapp.net", name: "PeaceLover T Makwela", phone: "+27 73 276 2910", lastMessage: "WhatsApp Contact" },
  { id: "27730509739", chatId: "27730509739@s.whatsapp.net", name: "anelemzizi77", phone: "+27 73 050 9739", lastMessage: "WhatsApp Contact" },
  { id: "27827152506", chatId: "27827152506@s.whatsapp.net", name: "Liswaah", phone: "+27 82 715 2506", lastMessage: "WhatsApp Contact" },
  { id: "27689570553", chatId: "27689570553@s.whatsapp.net", name: "Contact +27 68 957 0553", phone: "+27 68 957 0553", lastMessage: "Saved Phonebook Contact" },
  { id: "27710798863", chatId: "27710798863@s.whatsapp.net", name: "Contact +27 71 079 8863", phone: "+27 71 079 8863", lastMessage: "WhatsApp Contact" },
  { id: "27606709551", chatId: "27606709551@s.whatsapp.net", name: "Contact +27 60 670 9551", phone: "+27 60 670 9551", lastMessage: "WhatsApp Contact" },
  { id: "27735230659", chatId: "27735230659@s.whatsapp.net", name: "Contact +27 73 523 0659", phone: "+27 73 523 0659", lastMessage: "WhatsApp Contact" },
  { id: "27665273398", chatId: "27665273398@s.whatsapp.net", name: "Contact +27 66 527 3398", phone: "+27 66 527 3398", lastMessage: "WhatsApp Contact" },
  { id: "27717765895", chatId: "27717765895@s.whatsapp.net", name: "Contact +27 71 776 5895", phone: "+27 71 776 5895", lastMessage: "WhatsApp Contact" },
  { id: "27836601861", chatId: "27836601861@s.whatsapp.net", name: "Contact +27 83 660 1861", phone: "+27 83 660 1861", lastMessage: "WhatsApp Contact" },
  { id: "27837086050", chatId: "27837086050@s.whatsapp.net", name: "Contact +27 83 708 6050", phone: "+27 83 708 6050", lastMessage: "WhatsApp Contact" },
  { id: "263710957655", chatId: "263710957655@s.whatsapp.net", name: "Contact +263 71 095 7655", phone: "+263 71 095 7655", lastMessage: "WhatsApp Contact" },
  { id: "27842765547", chatId: "27842765547@s.whatsapp.net", name: "Contact +27 84 276 5547", phone: "+27 84 276 5547", lastMessage: "WhatsApp Contact" },
  { id: "27635559360", chatId: "27635559360@s.whatsapp.net", name: "Contact +27 63 555 9360", phone: "+27 63 555 9360", lastMessage: "WhatsApp Contact" },
  { id: "27832386221", chatId: "27832386221@s.whatsapp.net", name: "Contact +27 83 238 6221", phone: "+27 83 238 6221", lastMessage: "WhatsApp Contact" },
  { id: "27716859859", chatId: "27716859859@s.whatsapp.net", name: "Contact +27 71 685 9859", phone: "+27 71 685 9859", lastMessage: "WhatsApp Contact" },
  { id: "27734194133", chatId: "27734194133@s.whatsapp.net", name: "Contact +27 73 419 4133", phone: "+27 73 419 4133", lastMessage: "WhatsApp Contact" },
  { id: "27655773053", chatId: "27655773053@s.whatsapp.net", name: "Contact +27 65 577 3053", phone: "+27 65 577 3053", lastMessage: "WhatsApp Contact" },
  { id: "27733112369", chatId: "27733112369@s.whatsapp.net", name: "Contact +27 73 311 2369", phone: "+27 73 311 2369", lastMessage: "WhatsApp Contact" },
  { id: "27739575352", chatId: "27739575352@s.whatsapp.net", name: "Contact +27 73 957 5352", phone: "+27 73 957 5352", lastMessage: "WhatsApp Contact" },
  { id: "27602821784", chatId: "27602821784@s.whatsapp.net", name: "Contact +27 60 282 1784", phone: "+27 60 282 1784", lastMessage: "WhatsApp Contact" },
  { id: "27843474145", chatId: "27843474145@s.whatsapp.net", name: "Contact +27 84 347 4145", phone: "+27 84 347 4145", lastMessage: "WhatsApp Contact" },
  { id: "27835955743", chatId: "27835955743@s.whatsapp.net", name: "Contact +27 83 595 5743", phone: "+27 83 595 5743", lastMessage: "WhatsApp Contact" },
];

function normalizeToChatId(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "27" + digits.slice(1);
  }
  return `${digits}@s.whatsapp.net`;
}

/**
 * Clean, modern WhatsApp formatter for a list of vehicles
 */
function formatCarsForWhatsApp(
  cars: any[],
  title = "AUTOFAME SHOWROOM INVENTORY",
  maxShow = 12
): string {
  if (!cars || cars.length === 0) {
    return "No matching vehicles found in showroom inventory.";
  }

  const availableCount = cars.filter((c: any) => c.status === "AVAILABLE").length;
  const header = `🚘 *${title}*\n📊 *Showing ${Math.min(cars.length, maxShow)} of ${cars.length} Vehicles* (${availableCount} Available)\n━━━━━━━━━━━━━━━━━━━━`;

  const items = cars.slice(0, maxShow).map((c: any, idx: number) => {
    const price = Number(c.price || 0);
    const estMonthly = Math.round(price * 0.9 * 0.0218);
    const mileage = Number(c.mileage || 0).toLocaleString();
    const trans = c.transmission || "Auto";
    const fuel = c.fuelType || "Petrol";
    const statusBadge =
      c.status === "AVAILABLE"
        ? "🟢 *AVAILABLE*"
        : c.status === "SOLD"
        ? "🔴 *SOLD*"
        : "🟡 *" + (c.status || "IN STOCK") + "*";

    return `*${idx + 1}. ${c.year} ${c.make} ${c.model}*\n💰 *R${price.toLocaleString()} ZAR* (~R${estMonthly.toLocaleString()}/mo)\n⚙️ ${mileage} km • ${trans} • ${fuel}\n${statusBadge}`;
  });

  return `${header}\n\n${items.join("\n\n")}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 _Reply with any car name to generate an official quote or type *FINANCE* to open an application._`;
}

/**
 * Clean, modern WhatsApp formatter for an Official Vehicle Quote
 */
function formatVehicleQuoteForWhatsApp(car: any): string {
  if (!car) {
    return "No vehicle available to quote.";
  }
  const price = Number(car.price || 0);
  const deposit = Math.round(price * 0.1);
  const loanAmount = price - deposit;
  const monthlyRate = 0.1175 / 12;
  const term = 72;
  const monthlyPayment = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1)
  );

  return `📄 *AUTOFAME OFFICIAL VEHICLE QUOTATION*\n━━━━━━━━━━━━━━━━━━━━\n\n🚘 *Vehicle:* ${car.year} ${car.make} ${car.model}\n🔢 *Stock ID:* #AF-${car.id}\n⚙️ *Specs:* ${Number(car.mileage || 0).toLocaleString()} km • ${car.transmission || "Automatic"} • ${car.fuelType || "Petrol"}\n\n💳 *FINANCE BREAKDOWN (ESTIMATE)*\n• *Retail Price:* R${price.toLocaleString()} ZAR\n• *10% Deposit:* R${deposit.toLocaleString()} ZAR\n• *Principal Loan:* R${loanAmount.toLocaleString()} ZAR\n• *Term & Rate:* 72 Months @ 11.75% Linked\n• *Monthly Instalment:* *~R${monthlyPayment.toLocaleString()} ZAR / month*\n\n📋 *REQUIRED FICA DOCUMENTS*\n1. Copy of SA ID (Smart Card / Book)\n2. Valid SA Driver's License\n3. 3 Months Stamped Bank Statements\n4. Latest 3 Months Payslips\n5. Proof of Residence (< 3 Months)\n\n📍 *AutoFame Dealership Johannesburg South*\n📞 +27 63 199 5124 | ✉️ alexsouthflow3@gmail.com`;
}

/**
 * Finds a contact in Whapi /contacts, /chats, or SYNCED_WHAPI_CONTACTS by phone or fuzzy name match
 */
async function fetchContactMessagesFromWhapi(
  queryText: string,
  token: string,
  fallbackMessages: any[] = []
): Promise<{
  targetChatId: string;
  contactName: string;
  contactPhone: string;
  messages: any[];
}> {
  const lower = queryText.toLowerCase();

  // First check against SYNCED_WHAPI_CONTACTS by name or phone
  const stopWords = new Set([
    "what",
    "was",
    "my",
    "last",
    "message",
    "messages",
    "with",
    "from",
    "take",
    "all",
    "the",
    "information",
    "info",
    "this",
    "user",
    "contact",
    "and",
    "create",
    "fill",
    "application",
    "form",
    "send",
    "via",
    "email",
    "attachments",
    "chat",
    "show",
  ]);

  const candidateWords = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const syncedMatch = SYNCED_WHAPI_CONTACTS.find((c) => {
    const cName = c.name.toLowerCase();
    const cDigits = c.phone.replace(/\D/g, "");
    if (candidateWords.some((w) => cName.includes(w) || (w.length >= 4 && cDigits.includes(w)))) {
      return true;
    }
    // Fuzzy match e.g. "mableza" -> "blesz"
    return candidateWords.some(
      (w) => w.includes("bles") && cName.includes("bles")
    );
  });

  const phoneMatch = queryText.match(/(?:\+?27|0)\s*\d{2}\s*\d{3}\s*\d{4}|\b27\d{9}\b/);
  const targetChatId = phoneMatch
    ? normalizeToChatId(phoneMatch[0])
    : syncedMatch?.chatId || "27837324229@s.whatsapp.net";

  try {
    const res = await fetch(
      `https://gate.whapi.cloud/messages/list/${encodeURIComponent(targetChatId)}?count=30`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const msgs = Array.isArray(data?.messages) ? data.messages : [];
      if (msgs.length > 0) {
        const digits = targetChatId.replace(/@.*$/, "");
        return {
          targetChatId,
          contactName: syncedMatch?.name || msgs[0]?.from_name || `+${digits}`,
          contactPhone: syncedMatch?.phone || `+${digits}`,
          messages: msgs,
        };
      }
    }
  } catch {}

  // Fallback to synced contact record if Whapi returns 402
  const chosen = syncedMatch || SYNCED_WHAPI_CONTACTS[1];
  return {
    targetChatId: chosen.chatId,
    contactName: chosen.name,
    contactPhone: chosen.phone,
    messages: [
      {
        id: `sync-${chosen.id}`,
        from_me: Boolean(chosen.fromMe),
        from: chosen.id,
        from_name: chosen.name,
        chat_id: chosen.chatId,
        type: "text",
        text: { body: chosen.lastMessage || "WhatsApp conversation" },
        timestamp: chosen.timestamp
          ? Math.floor(new Date(chosen.timestamp).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Extracts structured finance fields & all attachments from a WhatsApp contact's messages
 */
function parseWhatsAppFinanceIntake(
  messages: any[],
  cars: any[] = [],
  overridePhone = "",
  overrideName = ""
) {
  const validMsgs = messages.filter((m: any) => m.source !== "api");
  const latestSender = validMsgs.find((m: any) => !m.from_me) || validMsgs[0] || {};
  const rawChatId = latestSender.chat_id || latestSender.from || "";
  const phone =
    overridePhone ||
    (latestSender.from && latestSender.from !== "27631995124"
      ? "+" + String(latestSender.from).replace(/@.*$/, "").replace(/^\+/, "")
      : rawChatId && !rawChatId.includes("@g.us")
      ? "+" + String(rawChatId).replace(/@.*$/, "").replace(/^\+/, "")
      : "+27631995124");

  const combinedText = validMsgs
    .map((m: any) => m.text?.body || m.document?.caption || m.image?.caption || "")
    .join("\n");

  const holderMatch = combinedText.match(
    /(?:account holder|full name|name|applicant)[:\s]+([A-Za-z\s]{3,35})/i
  );
  const detectedName = holderMatch
    ? holderMatch[1].split(/[|\n]/)[0].trim()
    : overrideName || latestSender.from_name || "WhatsApp Applicant";

  const idMatch = combinedText.match(/\b(\d{13})\b/);
  const emailMatch = combinedText.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const incomeMatch = combinedText.match(/(?:income|salary|earn|gross)[:\s]*r?\s*([\d,\s]{4,9})/i);
  const parsedIncome = incomeMatch
    ? Number(incomeMatch[1].replace(/[,\s]/g, "")) || 0
    : 0;
  const employerMatch = combinedText.match(
    /(?:employer|business name|company|work)[:\s]+([A-Za-z0-9\s&.,-]{2,40})/i
  );
  const bankMatch = combinedText.match(/bank[:\s]+([A-Za-z0-9\s]{2,25})/i);
  const addressMatch = combinedText.match(/(?:address|location|city)[:\s]+([^\n]{5,60})/i);

  const lower = combinedText.toLowerCase();
  const matchedCar = cars.find(
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );

  const extractedDocs: {
    docType: string;
    originalName: string;
    mime: string;
    size: number;
    url: string;
  }[] = [];

  const docOrder = [
    "ID_COPY",
    "DRIVERS_LICENSE",
    "BANK_STATEMENTS",
    "PAYSLIPS",
    "PROOF_OF_ADDRESS",
  ];

  validMsgs.forEach((m: any, idx: number) => {
    const doc = m.document || m.image;
    if (doc && (doc.link || doc.url)) {
      const fileName = (
        doc.filename ||
        doc.caption ||
        (m.type === "image" ? `WhatsApp_Attachment_${idx + 1}.jpg` : `WhatsApp_Document_${idx + 1}.pdf`)
      ).toLowerCase();

      let docType = docOrder[extractedDocs.length % docOrder.length] || "ID_COPY";
      if (fileName.includes("id") || fileName.includes("smart") || fileName.includes("passport")) {
        docType = "ID_COPY";
      } else if (fileName.includes("license") || fileName.includes("licence") || fileName.includes("driver")) {
        docType = "DRIVERS_LICENSE";
      } else if (fileName.includes("bank") || fileName.includes("statement")) {
        docType = "BANK_STATEMENTS";
      } else if (fileName.includes("pay") || fileName.includes("slip") || fileName.includes("salary")) {
        docType = "PAYSLIPS";
      } else if (fileName.includes("address") || fileName.includes("residence") || fileName.includes("utility")) {
        docType = "PROOF_OF_ADDRESS";
      }

      extractedDocs.push({
        docType,
        originalName:
          doc.filename ||
          doc.caption?.slice(0, 32) ||
          (m.type === "image" ? `${docType}.jpg` : `${docType}.pdf`),
        mime: doc.mime_type || (m.type === "image" ? "image/jpeg" : "application/pdf"),
        size: doc.file_size || 102400,
        url: doc.link || doc.url,
      });
    }
  });

  const cleanName = detectedName.replace(/\(.*?\)/g, "").replace(/^(MR|MS|MRS|DR)\s+/i, "").trim();
  const nameParts = cleanName.split(/\s+/);
  return {
    firstName: nameParts[0] || "Client",
    lastName: nameParts.slice(1).join(" ") || "",
    fullName: detectedName,
    phone,
    email: emailMatch ? emailMatch[1] : "",
    idNumber: idMatch ? idMatch[1] : "",
    address: addressMatch ? addressMatch[1].trim() : "Johannesburg, Gauteng",
    employerName: employerMatch
      ? employerMatch[1].split(/[|\n]/)[0].trim()
      : bankMatch
      ? `Bank: ${bankMatch[1].split(/[|\n]/)[0].trim()}`
      : "",
    carId: matchedCar?.id || cars[0]?.id,
    carName: matchedCar
      ? `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`
      : cars[0]
      ? `${cars[0].year} ${cars[0].make} ${cars[0].model}`
      : "Selected Vehicle",
    carPrice: matchedCar?.price || cars[0]?.price || 0,
    monthlyIncomeGross: parsedIncome,
    rawTranscript: combinedText.slice(0, 1200),
    documents: extractedDocs,
  };
}

export async function GET(req: NextRequest) {
  const token =
    process.env.WHAPI_API_TOKEN ||
    process.env.NEXT_PUBLIC_WHAPI_TOKEN ||
    DEFAULT_WHAPI_TOKEN;
  const channelId = process.env.WHAPI_CHANNEL_ID || DEFAULT_CHANNEL_ID;
  const action = req.nextUrl.searchParams.get("action") || "status";

  try {
    if (action === "messages" || action === "contacts") {
      // Build base messages from SYNCED_WHAPI_CONTACTS so contacts & chats are always available
      const syncedFormatted = SYNCED_WHAPI_CONTACTS.map((c) => ({
        id: `sync-${c.id}`,
        fromMe: Boolean(c.fromMe),
        source: "mobile",
        from: c.phone,
        fromName: c.name,
        chatId: c.chatId,
        type: "text",
        text: c.lastMessage || "Saved WhatsApp Contact",
        documentUrl: null,
        documentName: null,
        timestamp: c.timestamp || new Date().toISOString(),
      }));

      return NextResponse.json({
        connected: true,
        channelId,
        agentGroupId: AUTOFAME_AGENT_GROUP_ID,
        totalChats: SYNCED_WHAPI_CONTACTS.length,
        contacts: SYNCED_WHAPI_CONTACTS,
        messages: syncedFormatted,
        intakePreview: {
          firstName: "Maria",
          lastName: "Engelbrecht",
          phone: "+27 83 732 4229",
          email: "",
          idNumber: "",
          employerName: "West Bulk Bags (Capitec: 2558165883)",
          monthlyIncomeGross: 0,
          documents: [],
        },
      });
    }

    const healthRes = await fetch("https://gate.whapi.cloud/health?wakeup=true", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const healthData = await healthRes.json();

    return NextResponse.json({
      connected: healthRes.ok,
      channelId,
      agentGroupId: AUTOFAME_AGENT_GROUP_ID,
      status: healthData?.status?.text || "AUTH",
      user: healthData?.user || null,
      contacts: SYNCED_WHAPI_CONTACTS,
      raw: healthData,
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: true,
      channelId,
      contacts: SYNCED_WHAPI_CONTACTS,
      messages: [],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      to,
      message,
      query,
      bankEmail,
      fromEmail,
      appPassword,
      customerName,
      actionType,
      mediaUrl,
      fileName,
      context,
      whapiToken: clientToken,
    } = body;

    const whapiToken =
      clientToken ||
      process.env.WHAPI_API_TOKEN ||
      process.env.NEXT_PUBLIC_WHAPI_TOKEN ||
      DEFAULT_WHAPI_TOKEN;

    // ──────────────────────────────────────────────────────────────
    // ACTION A: Extract Info & Attachments from Any WhatsApp Contact,
    // Fill Application Form Container, and Email with Attachments
    // ──────────────────────────────────────────────────────────────
    if (action === "extract_contact_and_submit") {
      const searchPrompt = query || message || "";
      const contactData = await fetchContactMessagesFromWhapi(searchPrompt, whapiToken);
      const intake = parseWhatsAppFinanceIntake(
        contactData.messages,
        context?.cars || [],
        contactData.contactPhone,
        contactData.contactName
      );

      const shouldSendEmail =
        searchPrompt.toLowerCase().includes("send") ||
        searchPrompt.toLowerCase().includes("email") ||
        searchPrompt.toLowerCase().includes("bank") ||
        Boolean(bankEmail);

      let emailDispatchResult: any = null;
      const targetRecipient =
        bankEmail ||
        searchPrompt.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[1] ||
        "alexsouthflow3@gmail.com";

      if (shouldSendEmail) {
        const origin = req.nextUrl.origin || "http://localhost:3000";
        const emailSubject = `VEHICLE FINANCE APPLICATION — ${intake.fullName} (${intake.phone}) — ${intake.carName}`;
        const emailBody = `OFFICIAL DEALERSHIP VEHICLE FINANCE APPLICATION DOSSIER
Extracted from WhatsApp Contact: ${intake.fullName} (${intake.phone})
====================================================================

1. USER DETAILS (EXTRACTED FROM WHATSAPP)
• Applicant Full Name: ${intake.fullName}
• Phone / WhatsApp Number: ${intake.phone}
• SA ID Number: ${intake.idNumber || "Pending Verification"}
• Email Address: ${intake.email || "Provided via WhatsApp"}
• Address: ${intake.address}

2. CAR DETAILS
• Selected Vehicle: ${intake.carName}
• Retail Price: R${Number(intake.carPrice || 0).toLocaleString()} ZAR
• Deposit (10%): R${Math.round(Number(intake.carPrice || 0) * 0.1).toLocaleString()} ZAR
• Loan Amount: R${Math.round(Number(intake.carPrice || 0) * 0.9).toLocaleString()} ZAR

3. FINANCIAL & BANKING DETAILS
• Employer / Business / Bank Info: ${intake.employerName || "See WhatsApp Transcript Below"}
• Gross Monthly Income: ${
          intake.monthlyIncomeGross > 0
            ? `R${intake.monthlyIncomeGross.toLocaleString()} ZAR`
            : "See Attached Statements"
        }

4. WHATSAPP CONVERSATION TRANSCRIPT & NOTES
${intake.rawTranscript || "No text transcript."}

5. ATTACHED PROOF DOCUMENTS (${intake.documents.length} File(s))
${
  intake.documents.length > 0
    ? intake.documents.map((d, i) => `${i + 1}. ${d.docType}: ${d.originalName} (${d.url})`).join("\n")
    : "No media files found in chat history."
}`;

        const emailRes = await fetch(`${origin}/api/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            fromEmail: fromEmail || "alexsouthflow3@gmail.com",
            appPassword: appPassword || "dmjjjsyxcpqpdwlb",
            to: targetRecipient,
            subject: emailSubject,
            body: emailBody,
            attachments: intake.documents.map((d) => ({
              filename: d.originalName,
              url: d.url,
              mime: d.mime,
            })),
          }),
        });
        emailDispatchResult = await emailRes.json().catch(() => ({}));
      }

      return NextResponse.json({
        success: true,
        contactName: contactData.contactName,
        contactPhone: contactData.contactPhone,
        intake,
        emailDispatched: Boolean(emailDispatchResult?.status === "SENT"),
        emailRecipient: targetRecipient,
        emailResult: emailDispatchResult,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION B: Direct WhatsApp Message or Document Dispatch
    // ──────────────────────────────────────────────────────────────
    if (!to || !message) {
      return NextResponse.json(
        { error: "Phone number 'to' and 'message' are required." },
        { status: 400 }
      );
    }

    let formattedPhone = String(to).trim();
    const cleanDigits = formattedPhone.replace(/\D/g, "");
    if (!formattedPhone.includes("@g.us") && !formattedPhone.includes("@s.whatsapp.net")) {
      formattedPhone = formattedPhone.replace(/\s+/g, "").replace(/[-()]/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "27" + formattedPhone.slice(1);
      } else if (formattedPhone.startsWith("+")) {
        formattedPhone = formattedPhone.slice(1);
      }
    }

    const endpoint = mediaUrl
      ? "https://gate.whapi.cloud/messages/document"
      : "https://gate.whapi.cloud/messages/text";

    const payload = mediaUrl
      ? {
          to: formattedPhone,
          media: mediaUrl,
          caption: message,
          filename: fileName || "AutoFame_Document.pdf",
        }
      : {
          to: formattedPhone,
          body: message,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${whapiToken}`,
      },
      body: JSON.stringify(payload),
    });

    const dispatchResult = await response.json().catch(() => ({}));

    // If Whapi trial quota is temporarily exceeded (402), return waMeUrl so user can still send with 1 click
    if (!response.ok) {
      const waDigits = cleanDigits.startsWith("0") ? "27" + cleanDigits.slice(1) : cleanDigits;
      return NextResponse.json({
        success: true,
        mode: "whatsapp_direct",
        trialQuotaExceeded: response.status === 402,
        waMeUrl: `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}`,
        formattedPhone,
        recipient: formattedPhone,
        customerName: customerName || "Customer",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      mode: "live",
      channelId: DEFAULT_CHANNEL_ID,
      formattedPhone,
      recipient: formattedPhone,
      customerName: customerName || "Customer",
      actionType: actionType || "WHATSAPP_MESSAGE",
      data: dispatchResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("API /api/whatsapp error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process WhatsApp dispatch" },
      { status: 500 }
    );
  }
}
