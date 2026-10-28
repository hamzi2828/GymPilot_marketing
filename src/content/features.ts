// What GymsPilotPro does, in the buyer's words.
//
// One list, used in two places: /features shows all of them grouped, and
// every feature has a page of its own at /features/<slug>. The landing page
// names six outcomes (content/site.ts) and links each to a feature here. `screens` mirrors the real product
// (GymPilot_frontend, the member app and the Windows desk app), so nothing
// here promises a screen that does not exist.
//
// Honesty rule: every claim here is something the product does today. Money
// taken at the desk (cash, card terminal, bank transfer, JazzCash, Easypaisa,
// other wallets) is *recorded* as how the member paid -- GymsPilotPro is not a
// payment gateway for those. Online, each gym picks one way: its own Safepay
// account in Pakistan (card, JazzCash, Easypaisa, bank apps), its own Stripe
// account (cards), or Generic (a bank transfer with a receipt that staff
// approve, in any country) -- the money goes straight to the gym, never
// through GymsPilotPro. Automatic card payments are the member's choice and
// are never promised to go through: a declined card gets the payment link.
//
// House style: `text` is one sentence a busy owner reads in a glance,
// `points` are three to five short phrases, and `body` is two or three short
// paragraphs for the feature's own page. If a paragraph needs a second
// breath, it is not written plainly enough.
//
// `slug` is the feature's web address. Changing one breaks every link and
// search result that points at it, so add new features rather than renaming.

export type GroupKey = "desk" | "checkin" | "money" | "shop" | "classes" | "team" | "reach" | "control";

export type FeatureKey =
  | "members"
  | "desksale"
  | "feedesk"
  | "dues"
  | "renewals"
  | "logins"
  | "import"
  | "frontdesk"
  | "alerts"
  | "attendance"
  | "billing"
  | "offers"
  | "reports"
  | "dailysales"
  | "books"
  | "assets"
  | "pos"
  | "receipts"
  | "booking"
  | "pt"
  | "staff"
  | "trainerpay"
  | "website"
  | "content"
  | "app"
  | "selfservice"
  | "messaging"
  | "leads"
  | "setup"
  | "security"
  | "data";

export interface Feature {
  /** Internal name: pictures, icons and related links are keyed by it. */
  key: FeatureKey;
  /** The page's address, /features/<slug>. Never change a published one. */
  slug: string;
  group: GroupKey;
  /** Two or three words, for menus, breadcrumbs and cards. */
  name: string;
  /** The headline on its own page. */
  title: string;
  /** One sentence: the short summary everywhere it appears. */
  text: string;
  /** A few plain words for its card: what it does, for someone who has
   *  never used gym software. The detail is on the feature's own page. */
  short: string;
  /** Two or three short paragraphs, on the feature's own page. */
  body: string[];
  /** What it does, three to five short phrases. */
  points: string[];
  /** Where it lives in the product. */
  screens: string[];
  /** Features a reader of this one usually wants next. */
  related?: FeatureKey[];
  /** Bought alongside a plan rather than included in it. */
  addon?: boolean;
}

export const FEATURE_GROUPS: { key: GroupKey; label: string; title: string; text: string }[] = [
  { key: "desk", label: "Front desk & fees", title: "The front desk and the fees", text: "Signing people up, taking the money and knowing who owes what, without a ledger behind the counter." },
  { key: "checkin", label: "Check-in", title: "Checking people in", text: "Fingerprint, QR code or member ID, and the desk is told out loud when a fee needs paying." },
  { key: "money", label: "Money & reports", title: "Money and reports", text: "Getting paid, and knowing to the day what came in, what went out and what is left." },
  { key: "shop", label: "Shop & receipts", title: "The shop and the till", text: "Drinks, supplements, kit and lockers sold over the counter, with a receipt from your own receipt printer." },
  { key: "classes", label: "Classes & PT", title: "Classes and personal training", text: "Your timetable, your trainers' diaries, and members booking themselves in." },
  { key: "team", label: "Staff & trainers", title: "Your staff and trainers", text: "Rotas, leave and payslips for the team, and trainers paid a salary, a commission or both." },
  { key: "reach", label: "Website, portal & messages", title: "Reaching your members", text: "Your website, the member portal, and the messages that bring people back." },
  { key: "control", label: "Data & security", title: "Set up, locked down, yours alone", text: "Your settings, who sees what, and data that is only ever yours." },
];

export const FEATURES_PAGE = {
  /** The heading, before the product's name (which is drawn in colour). */
  title: "What you get with",
  hint: "Pick an area to jump straight to it.",
  note: "Nothing on this page is an upgrade or an extra monthly fee, except the native member app. It is an add-on on Starter and Growth, comes with Pro, and is not offered on Basic. Members on every plan use the member portal in their browser.",
};

export const FEATURES: Feature[] = [
  /* ------------------------------- desk ------------------------------- */
  {
    key: "members",
    slug: "member-records",
    group: "desk",
    name: "Member records",
    short: "All member details in one place.",
    title: "Every member in one place",
    text: "Contact details, member ID, health form, signed agreement, documents and private notes on one page.",
    body: [
      "One page per member instead of a folder behind the desk: phone, address, date of birth, emergency contact, the health questionnaire, the agreement they signed on screen, their documents, and notes only staff can see.",
      "Every member gets an ID the moment their account is made (GP-0001, GP-0002 and on), so the desk finds anyone by name, phone number or member ID, and a member whose phone is flat can still be checked in by number.",
      "The members list says where everyone stands without opening anything: their package, next expiry, what they paid, their discount and any balance due. It also filters to the members who owe.",
    ],
    points: ["Member ID from day one (GP-0001)", "Find anyone by name, phone or ID", "Health questionnaire (PAR-Q)", "Agreement signed on screen", "Staff-only notes and documents"],
    screens: ["Admin → Users", "Admin → Users → Profile", "Settings → Memberships", "Member app → Profile"],
    related: ["desksale", "feedesk", "import"],
  },
  {
    key: "desksale",
    slug: "desk-sign-up",
    group: "desk",
    name: "Desk sign-up",
    short: "Join a new member in one quick form.",
    title: "Sign a member up on one screen",
    text: "Their details, the package, start date, discount, admission fee, trainer and payment. One form, and a receipt at the end.",
    body: [
      "Someone walks in and wants to join. Users → Add member takes it all on one screen: who they are and how they get their password, the package, when it starts (today, after a number of days or on a date), a discount with a note of why, the admission fee charged, waived or at a different amount, and a personal trainer with their fee and commission.",
      "Record how they paid (cash, a card on your own terminal, bank transfer, JazzCash, Easypaisa or another mobile wallet) and how much they paid now. These are payment methods you record, not a payment gateway: the money reaches you as it always has. The total and the balance due are worked out as you fill the form in.",
      "Save, and the member and their membership are created together or, if anything is wrong, neither is. You get their member ID straight away, the password to hand over once if you chose one, and a thermal receipt of what was recorded.",
    ],
    points: ["One form: member, package and payment", "Start today, after some days or on a date", "Admission fee charged, waived or changed", "Trainer, fee and commission in the same sale", "Member ID, password and receipt at the end"],
    screens: ["Admin → Users → Add member", "Admin → Packages", "Admin → Trainers"],
    related: ["feedesk", "dues", "logins"],
  },
  {
    key: "feedesk",
    slug: "collect-fees",
    group: "desk",
    name: "Collect fees",
    short: "Take fees and print a receipt.",
    title: "A till for membership fees",
    text: "Find a member by name, phone or member ID, then renew, clear their dues or sell a first membership, and print the receipt.",
    body: [
      "Collect fees is the desk's till for memberships. Type a name, a phone number however it is written, or a member ID (just “184” finds GP-0184), and Enter picks the match. The member's card shows their photo, package, fee and discount, next expiry with the days left or overdue, and any balance due.",
      "From there, one of three: Collect & renew, starting from the current expiry, today or a date, with a discount or an agreed amount, taking all of it or part; Collect dues against anything still owed; or sell a new membership, with the admission fee when one is due. A card subscription that renews by itself is explained, not charged twice.",
      "Every payment prints a thermal receipt of what was recorded: the period, the fees, the discount, what was paid, the balance left, the invoice number and who took the money. It is built for a queue: / to search, R to renew, D for dues, N for a new membership, P to print.",
    ],
    points: ["Search by name, phone or member ID", "Collect & renew in one step", "Collect dues against any balance", "Thermal receipt for every payment", "Keyboard shortcuts for a queue"],
    screens: ["Admin → Collect fees", "Admin → Fee expiry → Collect"],
    related: ["renewals", "dues", "receipts"],
  },
  {
    key: "dues",
    slug: "part-payments-and-dues",
    group: "desk",
    name: "Part payments & dues",
    short: "Take part now, see who still owes.",
    title: "Part payments, and who still owes",
    text: "Take part of the fee today, collect the rest as it comes in, and always know who owes what.",
    body: [
      "Plenty of members pay in instalments. Sell the membership with what they paid today and it starts at once; the rest is a balance due, on the membership and on their invoice.",
      "When they bring the next part, Collect fees → Collect dues takes it against the balance (cash, card, bank transfer or wallet) and prints a receipt showing what is still owed; the invoice lists every payment received. The members list shows each member's balance, and the Dues list totals what everyone owes.",
      "The desk is reminded too. A member with money owing is checked in as normal, with an amber “Balance due” warning and, if you want it, a spoken “Please clear your balance”.",
    ],
    points: ["Pay part now, the rest later", "Every instalment recorded with its method", "Balance on the invoice and the receipt", "Dues list with totals", "Balance due flagged at check-in"],
    screens: ["Admin → Collect fees → Collect dues", "Admin → Fee expiry → Dues", "Admin → Users (Balance due)", "Admin → Package Orders → Record payment", "Windows desk app and kiosk"],
    related: ["feedesk", "renewals", "alerts"],
  },
  {
    key: "renewals",
    slug: "renewals-and-fees-due",
    group: "desk",
    name: "Fee expiry & renewals",
    short: "See whose fee is due and collect it.",
    title: "Whose fee is due, whose has run out, who owes",
    text: "Three lists to work through (expiring, expired or unpaid, and dues), each with a Collect button, a CSV and a print-out.",
    body: [
      "Fee expiry is the desk's call list. Expiring shows whose membership ends in the next few days: pick 1, 3, 7, 15 or 30, or any number up to a year. Expired / unpaid shows whose has run out without a renewal, paid or never paid. Dues shows what each member still owes, with the total at the top. The dashboard's “fees due” card opens the same list.",
      "Every row has a Collect button that opens Collect fees on that member with the right form ready: a renewal for the expiring and expired, the dues payment for those who owe. Export any list as a CSV, or print it as a clean page for the desk.",
      "Renew and the new term starts when the current one ends, so nobody loses days by paying early, and nobody pays the admission fee twice. Got a date wrong, or agreed a discount after the sale? Change the dates on a membership, or its discount when it was paid at the desk, and every change is kept with who made it and when. GymsPilotPro also reminds members before their fee runs out. With Safepay connected, it reminds them before the due date, on it and on the last day, each time with a link to pay online.",
    ],
    points: ["Expiring in the next N days", "Expired or never paid", "Dues with totals", "Collect straight from the list", "CSV and print"],
    screens: ["Admin → Fee expiry", "Admin → Dashboard (fees due)", "Admin → Package Orders → Renew, Edit terms", "Admin → Messaging → Campaigns", "Settings → Payments"],
    related: ["feedesk", "dues", "billing"],
  },
  {
    key: "logins",
    slug: "members-without-email",
    group: "desk",
    name: "Members without email",
    short: "Add members with just a phone number.",
    title: "Members without an email address",
    text: "Add members with just a phone number, and give them a username and password yourself.",
    body: [
      "Not every member has an email address, or wants to hand one over. A phone number is enough to add them, at the desk or in an import.",
      "They sign in with a username instead. Staff type a password for them, or have GymsPilotPro make a strong one. It is shown once, with a copy button, to hand over there and then. No reset email needed, and any session they already had is signed out.",
      "Staff accounts work the same way: sign in with an email or a username, and a manager can set a password without anyone waiting for an email.",
    ],
    points: ["A phone number is enough", "Sign in with a username", "Set or generate a password", "Shown once, never emailed", "Old sessions signed out"],
    screens: ["Admin → Users → New User", "Admin → Users → Set password", "Admin → Staff → Set password", "Sign-in page"],
    related: ["members", "import", "security"],
  },
  {
    key: "import",
    slug: "switch-from-other-software",
    group: "desk",
    name: "Switch from other software",
    short: "Bring your members over from a spreadsheet.",
    title: "Bring your members across",
    text: "Import members and their memberships from a spreadsheet, and check the result before anything is saved.",
    body: [
      "Export a CSV from the system you use now and import it into GymsPilotPro. Column names are matched loosely, so “First Name”, “firstname” and “first_name” all work, and there is a template to download if you are starting from a blank sheet.",
      "A preview comes first: how many members will be created, which columns were recognised, and every row with a problem, by line number. Nothing is saved until you say so.",
      "Members arrive with their joining date, their member number from the old system if it is free, and their package with its start and end dates, so renewals fall where they did before. Nobody is charged an admission fee for a gym they already belong to.",
    ],
    points: ["Loose column matching, template included", "Preview before anything is saved", "Keeps joining dates and old member numbers", "Memberships with their dates", "Rows without an email are fine"],
    screens: ["Admin → Users → Import CSV"],
    related: ["members", "logins", "desksale"],
  },

  /* ----------------------------- check-in ----------------------------- */
  {
    key: "frontdesk",
    slug: "check-in",
    group: "checkin",
    name: "Check-in",
    short: "Fingerprint, QR code or member ID at the door.",
    title: "Know who is in the gym",
    text: "Fingerprint, QR code or member ID at the desk, and a lapsed fee is called out the moment they arrive.",
    body: [
      "Three ways in, all writing to the same register. At the counter, the GymsPilotPro desk app for Windows reads fingerprints on a DigitalPersona USB reader; our team installs it on your front-desk PC for you. Any tablet or PC with a browser becomes a kiosk that scans a member's QR code with its camera, takes a typed member ID, or lets staff pick a name. And members carry their own QR code on their phone.",
      "A member whose fee has run out is still checked in, so you know the visit happened, but the desk sees it in red and hears it, and can have a word there and then. Staff clock in on the same reader, against their rota.",
      "Fingerprints are only linked with the member's consent, and are stored encrypted. Check-in needs an internet connection, and wall-mounted fingerprint machines such as ZKTeco are not supported.",
    ],
    points: ["Fingerprint desk app for Windows, installed by our team", "QR kiosk on any tablet", "Member ID when a phone is flat", "Member QR that refreshes itself", "Staff clock in on the same reader"],
    screens: ["Windows desk app", "Kiosk (any tablet)", "Website → My account → Check-in QR", "Admin → Fingerprints"],
    related: ["alerts", "attendance", "members"],
  },
  {
    key: "alerts",
    slug: "check-in-alerts",
    group: "checkin",
    name: "Voice alerts",
    short: "The desk speaks up when a fee is due.",
    title: "It says “Fee expired” out loud",
    text: "A different sound for each kind of check-in, then your own words spoken: “Fee expired, please renew”.",
    body: [
      "The desk is busy, and nobody reads every screen. So every check-in has a sound, and no two kinds share one: all is well, a fee running out or money owed, and a problem such as an expired membership each sound different. On the desk app, so does a finger nobody recognises.",
      "Then the desk speaks. Out of the box it says “Fee expired, please renew” for a lapsed or unpaid membership, “Your fee expires soon” for one running out, and “Please clear your balance” when money is owed. Change the words, or turn the voice off, under Attendance → Desk settings; the next scan uses them.",
      "The Windows desk app and the web kiosk play the same alerts, because the server decides which one each check-in gets, so the two never disagree.",
    ],
    points: ["A distinct sound for each kind of check-in", "Your own words, spoken", "“Balance due” warning in amber", "Same on the desk app and the kiosk", "Voice can be switched off"],
    screens: ["Admin → Attendance → Desk settings", "Windows desk app", "Kiosk (any tablet)"],
    related: ["frontdesk", "attendance", "dues"],
  },
  {
    key: "attendance",
    slug: "live-attendance",
    group: "checkin",
    name: "Live attendance",
    short: "See who is in the gym right now.",
    title: "Today's attendance, live",
    text: "Everyone who came in today, who is still inside, and who walked in paid or unpaid, updating as you watch.",
    body: [
      "Attendance → Today is the desk's view of the day. Every visit, newest first: arrival number, member ID, name, phone, package, when it runs out, time in and out, and a status: Paid, Unpaid, Expiring, Balance due or Frozen. It refreshes itself every 15 seconds.",
      "Across the top are the day's counts: visits, members, staff, who is in now, and how many came in paid, unpaid or still owing. The dashboard shows the same paid and unpaid numbers, counted the same way.",
      "Mistakes happen. Fix a check-in or check-out time with a note, or void a visit that should not count. The history is kept. Visits nobody checked out of are closed overnight and marked “No check-out”, without inventing a time.",
    ],
    points: ["Refreshes every 15 seconds", "Paid, unpaid and balance-due counts", "Member ID, phone and expiry on every row", "Fix times or void visits, with history", "Staff early, on time or late"],
    screens: ["Admin → Attendance → Today · live", "Admin → Dashboard", "Windows desk app → live board"],
    related: ["frontdesk", "alerts", "reports"],
  },

  /* ------------------------------- money ------------------------------ */
  {
    key: "billing",
    slug: "online-payments",
    group: "money",
    name: "Payments",
    short: "Card, JazzCash, Easypaisa or bank transfer.",
    title: "Get paid, however your members pay",
    text: "Members pay straight into your gym's own account: by card, JazzCash, Easypaisa or a bank app through Safepay, by card through Stripe, or by bank transfer with a receipt, in any country.",
    body: [
      "Pick how members pay online in Settings → Payments: Safepay in Pakistan, for card, JazzCash, Easypaisa and bank apps; Stripe, for cards where Stripe is available to your business; or Generic, a bank transfer with a receipt, which works in any country. Whichever you pick, the money goes straight to your gym's own account and never through GymsPilotPro.",
      "With Safepay, members pay on Safepay's secure page, and the membership is marked paid with the invoice and receipt sent. Before the due date, on it and on the last day, they get a reminder with a link to pay, and your bank and Raast details as a no-fee option if you have added them. These go by email and phone notification, and by SMS or WhatsApp through your own provider account. Safepay takes its fee on each payment, and opening an account needs your CNIC, an NTN from FBR and a bank account certificate.",
      "Members who want to can also save a card with Safepay and pay automatically on each due date. It is their choice: a box they tick says what will be charged and when, and they can turn it off at any time. Safepay keeps the card, not GymsPilotPro, and a declined card gets the payment link instead. You switch this on once Safepay has enabled it for your account.",
      "With Generic, the member gets the package details and a link before the due date, on it and on the last day, by email and by WhatsApp if you have connected it. The link shows your bank QR code and account details; they send the transfer, upload a screenshot, and your staff check it and approve it. There is no gateway fee and it works anywhere, but someone has to check each receipt.",
      "At the desk, record cash, bank transfer, JazzCash, Easypaisa, another wallet or a card on your own terminal. GymsPilotPro records how the member paid, and the money reaches you as it always has.",
    ],
    points: ["Safepay: card, JazzCash, Easypaisa, bank apps", "Stripe: cards, where Stripe is available", "Generic: bank transfer and receipt, anywhere", "Money straight to your own account", "Pay-link reminders, optional auto-pay"],
    screens: ["Settings → Payments", "Settings → Banks", "Admin → Package Orders → Payment link", "Admin → Registrations", "Website → Checkout, Payment link", "Website → My account → Automatic payments", "Member app → Membership"],
    related: ["renewals", "messaging", "dues"],
  },
  {
    key: "offers",
    slug: "discount-codes",
    group: "money",
    name: "Discount codes",
    short: "Run offers with simple codes.",
    title: "Discount codes and joining offers",
    text: "Make a code, choose what it takes off, and set when it stops working.",
    body: [
      "Make a code, choose whether it takes off a percentage or a fixed amount, and pick the packages it works on. Members type it at checkout, whichever way they pay.",
      "It stops working on the date you set, or after the number of uses you allow, and you decide whether it counts once or on every renewal.",
    ],
    points: ["Percent off or a fixed amount", "Start and end dates", "Limit how many can use it", "One package or all of them", "First payment or every renewal"],
    screens: ["Admin → Coupons", "Website → Packages & Checkout"],
    related: ["billing", "leads", "messaging"],
  },
  {
    key: "reports",
    slug: "dashboard-and-reports",
    group: "money",
    name: "Dashboard & reports",
    short: "Today's money and visitors at a glance.",
    title: "See how the business is doing",
    text: "Today's money and visitors on the dashboard; any period, and every download, in Reports.",
    body: [
      "Open the dashboard and today is on one screen: money in, expenses paid, who came in paid or unpaid, and the fees due in the next seven days. Below it, the month so far: revenue, expenses and new members.",
      "Reports go further: revenue, memberships, new registrations per day, attendance, bookings, and your busy hours and quiet ones, for any dates you pick. The net figure is the same profit and loss the Accounts screen shows, so the two never argue.",
      "Anything you can see, your accountant can have. Every export downloads as CSV or as a real Excel workbook, and every report prints, or saves as a PDF, as a tidy A4 page with your gym's name and the dates on it.",
    ],
    points: ["Today's money and visitors", "Fees due this week", "Any date range", "CSV or Excel (.xlsx)", "Print or save as PDF"],
    screens: ["Admin → Dashboard", "Admin → Reports", "Admin → Reports → Print / PDF"],
    related: ["dailysales", "books", "attendance"],
  },
  {
    key: "dailysales",
    slug: "daily-sales-report",
    group: "money",
    name: "Daily sales report",
    short: "Each day's takings, clearly split.",
    title: "What each day took, and how it was paid",
    text: "Every day's takings split into sign-ups, renewals, admission, trainer fees, dues and the shop, and by payment method.",
    body: [
      "Close the day knowing exactly what came in. For every day in the range: new sign-ups, renewals, admission fees, trainer fees, dues collected, refunds and shop sales, adding up to the day's total. It is the same figure the Accounts screen has for that day.",
      "Underneath, the totals by payment method: cash, card at the desk, card online, bank transfer, JazzCash, Easypaisa and other mobile wallets. Count the drawer against the cash line and you are done.",
      "Download it as a CSV with a totals row, or as an Excel workbook with a second sheet by payment method, or print it.",
    ],
    points: ["Sign-ups, renewals, admission, trainer fees", "Dues collected and refunds", "Shop sales in the same table", "Totals by payment method", "CSV, Excel or print"],
    screens: ["Admin → Reports → Daily sales"],
    related: ["books", "dues", "pos"],
  },
  {
    key: "books",
    slug: "profit-and-loss",
    group: "money",
    name: "Profit & loss",
    short: "See what you earn and what you spend.",
    title: "Profit and loss, line by line",
    text: "Membership, admission, trainer fees and the shop, set against commission, expenses, equipment and salaries.",
    body: [
      "Accounts → Overview is your profit and loss for any period: today, this month, or dates you choose. Money in: membership fees, admission fees, trainer fees and shop sales, less refunds. Money out: trainer commission, expenses, equipment bought and salaries.",
      "Each cost is counted once, so a payslip or an equipment purchase is never taken off twice. Expenses go under heads (rent, utilities, maintenance and the rest), and you can add your own, rename them, or retire one without losing the old entries.",
      "Find any sale by order number, name, phone or member ID, and hand your accountant the CSV.",
    ],
    points: ["Money in: membership, admission, trainers, shop", "Money out: commission, expenses, equipment, salaries", "Each cost counted once", "Your own expense heads", "CSV for the accountant"],
    screens: ["Admin → Accounts → Overview", "Admin → Accounts → Sales, Expenses", "Admin → Accounts → Manage heads"],
    related: ["dailysales", "assets", "trainerpay"],
  },
  {
    key: "assets",
    slug: "asset-register",
    group: "money",
    name: "Asset register",
    short: "Keep track of machines and their servicing.",
    title: "Know what you own, and when it is due a service",
    text: "Every machine with its price, warranty and service dates, and a reminder before either comes round.",
    body: [
      "Put every treadmill, rack and air conditioner on the register: what it cost, when you bought it, the invoice number, when the warranty ends and when it is next due a service. File them under your own asset heads.",
      "The bell in the admin tells you when a service is due within seven days or is overdue, and when a warranty ends within 30 days. One click lands on exactly those items.",
      "Filter the register by purchase date; equipment bought in a period counts in that period's profit and loss.",
    ],
    points: ["Cost, purchase date and invoice number", "Warranty end date", "Service due dates", "Reminders in the admin bell", "Your own asset heads"],
    screens: ["Admin → Accounts → Assets", "Admin header → bell"],
    related: ["books", "reports", "dailysales"],
  },

  /* ------------------------------- shop ------------------------------- */
  {
    key: "pos",
    slug: "point-of-sale",
    group: "shop",
    name: "Shop & till",
    short: "Sell drinks and supplements at the desk.",
    title: "Sell drinks, kit and lockers",
    text: "Ring up a basket at the desk, see the tax and the change before you take payment, and know what each sale made.",
    body: [
      "The desk becomes a till. Add products to a basket and see each line, the discount, the tax included and the total before you take the money. On cash, type what they handed over and the change is worked out for you.",
      "Record how they paid (cash, card, bank transfer, JazzCash, Easypaisa or another mobile wallet) or put it on the member's account. Stock counts drop by themselves and you are warned before something runs out. Lockers are rented out from the same place.",
      "Managers see what each sale cost and what it made, for any dates, and can export the lot as a CSV.",
    ],
    points: ["Basket with tax and discount", "Change worked out on cash", "Stock counted, low stock warned", "Profit per sale for managers", "Sales export (CSV)"],
    screens: ["Admin → Shop / POS", "Admin → Inventory", "Admin → Lockers", "Website → My account (their receipts)"],
    related: ["receipts", "dailysales", "books"],
  },
  {
    key: "receipts",
    slug: "thermal-receipts",
    group: "shop",
    name: "Thermal receipts",
    short: "Print neat receipts with your logo.",
    title: "Receipts from your receipt printer",
    text: "Till and membership receipts sized for 80 mm or 58 mm thermal rolls, with your logo, address and tax number on them.",
    body: [
      "Press Print and the receipt goes to your thermal printer on its own, not the whole page: one receipt as long as the sale and as wide as the roll, 80 mm or 58 mm.",
      "The desk prints the same receipt for memberships: a sign-up, a renewal or a balance paid, with the period, the admission and trainer's fees, the discount, what was paid, the balance left, the invoice number and who took the money.",
      "Every receipt carries your letterhead: the gym's name and logo, address, phone and email, your tax label and number, and a footer you write, such as a returns policy, opening hours or a thank-you. Preview it in Receipt settings before the first one prints.",
    ],
    points: ["80 mm or 58 mm rolls", "Shop sales and membership fees", "Your logo, details and tax number", "Balance left on the receipt", "Prints the receipt alone"],
    screens: ["Admin → Shop / POS → Receipt settings", "Admin → Collect fees → Print receipt", "Admin → Users → Add member", "Admin → Shop / POS → Print"],
    related: ["feedesk", "pos", "dailysales"],
  },

  /* ------------------------------ classes ----------------------------- */
  {
    key: "booking",
    slug: "class-booking",
    group: "classes",
    name: "Class booking",
    short: "Members book classes themselves.",
    title: "Members book classes from their phone",
    text: "Your timetable goes up once; members tap to book and waitlists fill themselves.",
    body: [
      "Put your timetable up once and it repeats every week. Members book from their phone or your website, and when a class is full they join the waitlist, which moves up on its own when someone drops out.",
      "Nobody texts you at 6am. You decide how far ahead people can book, when booking closes, how late is too late to cancel and what happens to no-shows. Holidays and cover instructors are a change to one date, not the whole timetable.",
    ],
    points: ["Repeats every week", "Waitlist moves up on its own", "Rules for late cancels and no-shows", "Holidays and cover instructors"],
    screens: ["Admin → Classes", "Admin → Bookings", "Admin → Timetable changes", "Website → Timetable", "Member app → Classes"],
    related: ["pt", "app", "messaging"],
  },
  {
    key: "pt",
    slug: "personal-training",
    group: "classes",
    name: "Personal training",
    short: "Members book sessions with trainers.",
    title: "Sell personal training",
    text: "Trainers set their free hours; members buy a pack and book the slots.",
    body: [
      "Each trainer has their own calendar and sets the hours they take clients. Members buy a pack of sessions and book straight into a free slot.",
      "Classes and sessions already booked are taken out automatically, so a member can only pick a time the trainer is really free. Every completed session carries the trainer's commission.",
    ],
    points: ["Trainer's own calendar", "Packs of 5 or 10 sessions", "Only genuinely free times shown", "Commission on every session"],
    screens: ["Admin → Personal Training", "Admin → Trainers", "Settings → Bookings & PT", "Member app → Personal training"],
    related: ["trainerpay", "booking", "app"],
  },

  /* ------------------------------- team ------------------------------- */
  {
    key: "staff",
    slug: "staff-and-payroll",
    group: "team",
    name: "Staff & payslips",
    short: "Staff rotas, leave and payslips.",
    title: "Run your team",
    text: "Rotas, time off and payslips, and everyone sees only their own part.",
    body: [
      "Put the rota up where everyone can see it, approve time off, and run payslips with personal training commission already on them. Staff see their own shifts and payslips from their account.",
      "Your receptionist does not need the books and your accountant does not need the timetable. Roles decide who sees what (manager, front desk, trainer, accountant), and you can make your own.",
    ],
    points: ["Manager, front desk, trainer, accountant", "Shift rota everyone can see", "Time-off requests to approve", "Payslips with PT commission", "Staff see their own shifts online"],
    screens: ["Admin → Staff", "Admin → Staff → Roster, Leave, Payslips", "Admin → Roles & Access", "Website → My account → My work"],
    related: ["trainerpay", "security", "attendance"],
  },
  {
    key: "trainerpay",
    slug: "trainer-pay",
    group: "team",
    name: "Trainer pay",
    short: "Pay trainers a salary, commission or both.",
    title: "Trainers paid by salary, commission or both",
    text: "Give each trainer a salary, a commission per session (a percentage or a fixed amount), or both.",
    body: [
      "Every trainer can have a salary, commission only, or both. Commission is a percentage of the session or a fixed amount per session, set for each trainer, or left alone, so your gym's default percentage applies.",
      "Sell a trainer with a membership at the desk and their fee and commission are recorded on the sale. Completed personal training sessions carry the commission they earned.",
      "Trainers with a staff account are paid through payslips, commission included; for the rest, GymsPilotPro shows what they are owed so you can pay them by hand. Either way it lands in your profit and loss.",
    ],
    points: ["A salary, or commission only", "Percent or fixed commission per session", "Trainer sold with a membership", "Commission on every completed session", "Counted in profit and loss"],
    screens: ["Admin → Trainers", "Admin → Personal Training", "Admin → Staff → Payslips"],
    related: ["pt", "staff", "books"],
  },

  /* ------------------------------- reach ------------------------------ */
  {
    key: "website",
    slug: "gym-website",
    group: "reach",
    name: "Your own website",
    short: "Your own gym website, ready to go.",
    title: "Your own website, on your own address",
    text: "A real website at yourgym.com with classes, prices, trainers, blog and map, in your colours.",
    body: [
      "Home, classes, trainers, prices, blog, opening hours, a map and a contact form, on your own web address with the padlock. Have a domain already? Tell us and our team connects it for you. People join and pay on it.",
      "Change a price in the admin and the website follows. Nothing to email us about and nothing to redeploy, and search engines see a real business, not a page on someone else's platform.",
    ],
    points: ["Your domain, logo and colours", "People join and pay on it", "Change a price, the site follows", "Found on Google"],
    screens: ["Website → Home, Classes, Trainers, Memberships", "Website → Blog, About, Contact, FAQs", "Settings → Website, Logo, Colour scheme"],
    related: ["content", "app", "leads"],
  },
  {
    key: "content",
    slug: "website-editor",
    group: "reach",
    name: "Website editor",
    short: "Change your website yourself, no developer.",
    title: "Change your website yourself",
    text: "Edit the home page, slides, blog and FAQs without waiting on a developer.",
    body: [
      "Everything on the public site is edited in the admin: the home page sections and hero slides, blog posts, testimonials, FAQs, your privacy policy and terms.",
      "Want your timetable on another website too? Drop it in with an embed and it stays in step with the real one.",
    ],
    points: ["Home page sections and hero slides", "Blog posts and pages", "Testimonials and FAQs", "Privacy policy and terms", "Timetable you can embed anywhere"],
    screens: ["Admin → Homepage", "Admin → Hero slides", "Admin → Blogs, Blog Settings", "Admin → Pages (FAQs, privacy, terms)", "Admin → Testimonials", "Website → Embedded timetable"],
    related: ["website", "setup", "messaging"],
  },
  {
    key: "app",
    slug: "member-app",
    group: "reach",
    addon: true,
    name: "Member app",
    short: "Your own app for members (add-on).",
    title: "A native phone app for your members",
    text: "An add-on: a native app in your colours, signed in with a username you issue. It is not in the app stores yet.",
    body: [
      "One app for every gym, and it becomes yours the moment a member signs in: your logo, your colours, your classes. Members book, check in with their QR code, pause or cancel, and see every visit and payment.",
      "Only people on your books can get in, because you issue the login.",
      "It is an add-on. Starter and Growth can add it for a price of its own, Pro includes it, and Basic does not offer it. The app is not in the App Store or Google Play yet, so ask us where it stands before you add it.",
      "You do not need it to start. On every plan, members use the member portal in their browser and add it to their home screen.",
    ],
    points: ["Add-on on Starter and Growth, included in Pro", "Your logo and colours", "Book classes and check in", "Every visit and payment", "No sign-up: you issue the login"],
    screens: ["Member app → Home, Classes, Membership, Profile", "Member app → Check in (QR)", "Admin → Users (issues the username)"],
    related: ["selfservice", "booking", "frontdesk"],
  },
  {
    key: "selfservice",
    slug: "member-accounts",
    group: "reach",
    name: "Member self-service",
    short: "Members see their bookings and bills online.",
    title: "Members look after themselves",
    text: "Bookings, invoices, details and their check-in code, all in the member portal, in every plan.",
    body: [
      "Every question a member would ask at the desk is answered on their own page: their classes and PT sessions, every payment and invoice, their visits, and their check-in QR code. With Safepay connected, a fee that is due has a Pay now button.",
      "It works in any browser, with nothing to download. Members can add it to their phone's home screen, so it opens like an app. This is in every plan.",
      "They change their own details, switch on two-step sign-in, turn off automatic card payments and download a copy of their data. That is a quieter front desk.",
    ],
    points: ["In every plan, in the browser", "Adds to the phone's home screen", "Their classes and PT sessions", "Every payment and invoice", "Check-in QR in the browser too"],
    screens: ["Website → My account → Profile", "Website → My account → My classes, Personal training", "Website → My account → History, Recent visits", "Website → My account → Automatic payments", "Website → My account → Check-in QR"],
    related: ["app", "billing", "frontdesk"],
  },
  {
    key: "messaging",
    slug: "messaging",
    group: "reach",
    name: "Email, SMS & WhatsApp",
    short: "Messages to members, sent for you.",
    title: "Talk to members where they already are",
    text: "Email and push notifications, plus SMS and WhatsApp through your own provider account. Most of it is sent for you.",
    body: [
      "Four ways to reach a member. Email goes out through your own email account, which you connect once in Settings. Push notifications are switched on in Settings. SMS and WhatsApp go through a provider account that you open and pay for, such as Twilio or WhatsApp Business from Meta, and GymsPilotPro sends through it.",
      "Class reminders, renewal reminders, missed-you nudges, win-back offers and birthday messages go out by themselves. With Safepay connected, a fee reminder carries a link to pay by card, JazzCash, Easypaisa or a bank app. Write the wording once and GymsPilotPro sends it on time, every time.",
      "When you want to say something yourself, choose who hears it (everyone, members ending soon, lapsed members or one group), and members can opt out whenever they like.",
    ],
    points: ["Class and renewal reminders", "Missed-you and win-back nudges", "Everyone, or just one group", "Email through your own mailbox", "SMS and WhatsApp need your own provider account"],
    screens: ["Admin → Messaging", "Admin → Messaging → Campaigns & Wording", "Settings → Messaging", "Member app → Notifications"],
    related: ["renewals", "leads", "app"],
  },
  {
    key: "leads",
    slug: "leads",
    group: "reach",
    name: "Leads & enquiries",
    short: "Turn website enquiries into members.",
    title: "Turn enquiries into members",
    text: "Every website enquiry becomes a lead you can follow up and convert.",
    body: [
      "Nothing gets lost in an inbox. Every enquiry from your website becomes a lead, due for a follow-up the same day.",
      "Move a lead along as you talk to them (new, contacted, trial, joined), with notes from every call, and turn them into a member without retyping anything.",
    ],
    points: ["Contact form becomes a lead", "New, contacted, trial, joined", "Notes from every call", "One click to make them a member"],
    screens: ["Admin → Leads", "Admin → Contact Queries", "Website → Contact"],
    related: ["website", "offers", "messaging"],
  },

  /* ------------------------------ control ----------------------------- */
  {
    key: "setup",
    slug: "setup-and-settings",
    group: "control",
    name: "Setup & settings",
    short: "Set currency, hours and colours easily.",
    title: "Set it up your way",
    text: "Country, currency, colours and opening hours are all switches.",
    body: [
      "A guided setup on day one, then everything is a setting: country, currency, time zone, opening hours, your logo, email, bank details and online payments.",
      "No code and no support ticket. Pick a currency and every price follows; pick a colour scheme and the website and the app both change.",
    ],
    points: ["Guided setup on day one", "Country and currency", "8 colour schemes", "Your logo, email and bank details"],
    screens: ["Admin → Setup (first run)", "Settings → General (Business, Money & time, Website)", "Settings → Logo, Colour Scheme", "Settings → Payments, SMTP, Banks, Messaging"],
    related: ["website", "security", "import"],
  },
  {
    key: "security",
    slug: "security",
    group: "control",
    name: "Security & roles",
    short: "Each staff member sees only what they should.",
    title: "Locked down by default",
    text: "Two-step sign-in, roles for staff, and a record of every change.",
    body: [
      "Staff see only their part of the gym: roles decide who sees what, and you can make your own. Two-step sign-in sends a code by email, and you can sign out every device at once.",
      "Anything that changes is written down in an audit log, with who did it. Members can download a copy of their own data.",
    ],
    points: ["Two-factor sign-in by email", "Sign out every device at once", "Roles decide who sees what", "Audit log of every change", "Members download their own data"],
    screens: ["Admin → Roles & Access", "Admin → Audit log", "Member → Privacy & security"],
    related: ["data", "staff", "selfservice"],
  },
  {
    key: "data",
    slug: "private-database",
    group: "control",
    name: "Private database",
    short: "Your gym's data is kept separate and private.",
    title: "Your private online presence",
    text: "Your gym gets its own website, its own member portal and its own private database.",
    body: [
      "Every gym on GymsPilotPro has a database of its own, never mixed with another gym's. That is unusual, and it is why we can promise nobody else's data is ever a query away from yours.",
      "Export your members, payments and reports from the admin panel whenever you like, as CSV or Excel. Your data stays yours if you leave.",
    ],
    points: ["A database per gym", "Never mixed with another gym", "Export members, payments and reports", "Still yours if you leave"],
    screens: ["A database per gym", "Downloads from every report"],
    related: ["reports", "security", "import"],
  },
];

const BY_KEY = new Map(FEATURES.map((f) => [f.key, f]));
const BY_SLUG = new Map(FEATURES.map((f) => [f.slug, f]));

export function featureByKey(key: FeatureKey): Feature {
  const feature = BY_KEY.get(key);
  if (!feature) throw new Error(`No feature called "${key}"`);
  return feature;
}

export function featureBySlug(slug: string): Feature | undefined {
  return BY_SLUG.get(slug);
}

/** Where a feature's own page lives. */
export function featureHref(key: FeatureKey): string {
  return `/features/${featureByKey(key).slug}`;
}

export function featuresIn(group: GroupKey): Feature[] {
  return FEATURES.filter((f) => f.group === group);
}

export function groupOf(feature: Feature) {
  return FEATURE_GROUPS.find((g) => g.key === feature.group)!;
}

/** The features a page points onwards to: its own picks, else its group. */
export function relatedTo(feature: Feature): Feature[] {
  const picks = feature.related?.length ? feature.related.map(featureByKey) : featuresIn(feature.group).filter((f) => f.key !== feature.key);
  return picks.slice(0, 3);
}
