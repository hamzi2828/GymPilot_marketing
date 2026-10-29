// Everything the marketing site says, in one place. Edit copy here; the
// components only lay it out. Nothing in this file is fetched -- prices come
// live from the API (see components/marketing/Pricing.tsx). The features
// themselves are in content/features.ts; a `feature` here links to its page.

import type { FeatureKey } from "./features";

/** A line of copy that can lead to a feature's own page. */
export type Linked = string | { text: string; feature: FeatureKey };

// Where this site lives, for canonical links, Open Graph, the sitemap and
// robots.txt. NEXT_PUBLIC_SITE_URL says so; on Vercel without it, the
// project's production domain does, then the deployment's own address. Only
// `next dev` falls back to localhost: a production build with no address
// stops with the reason, rather than publish a sitemap that points every
// search engine at http://localhost:3001.
function siteUrl(): string {
  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;
  const url = process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "");
  if (url) return url.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3001";
  // In the browser the address is not in doubt, and nothing there reads it
  // for search engines.
  if (typeof window !== "undefined") return window.location.origin;
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is not set. Set it to the address this site is served at (for example https://www.example.com) before building for production: canonical links, Open Graph, the sitemap and robots.txt are built from it."
  );
}

// The WhatsApp number people message us on, digits only, country code first
// (923001234567): the form wa.me links need.
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "").replace(/^0+/, "");

export const SITE = {
  name: "GymsPilotPro",
  tagline: "Run your whole gym from one place",
  // For search results and link previews: one sentence, under 160 characters.
  description: "Gym management software: collect fees, see who owes, check members in, run classes and reports, with your own gym website. Free trial on every plan.",
  url: siteUrl(),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  whatsapp: WHATSAPP,
  /** Opens a WhatsApp chat with us, the first message started. Empty when no number is set. */
  whatsappUrl: WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi GymsPilotPro, I would like to know more for my gym.")}` : "",
  heroPills: ["Memberships & billing", "Class booking", "Personal training", "Your own domain"],
};

// Who sells GymsPilotPro, for the legal pages (/terms, /privacy, /refund-policy).
// Every line is read from the environment and shown only when it is set, so
// nothing invented ever appears as the seller's name or address. See
// .env.example for what each one is.
export const LEGAL = {
  /** The person or company that sells GymsPilotPro, as registered. */
  name: process.env.NEXT_PUBLIC_LEGAL_NAME || "",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  /** Where legal and privacy questions go; the contact email when not set. */
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  /** The country whose law the terms follow, as it should read after "the laws of". */
  governingLaw: process.env.NEXT_PUBLIC_LEGAL_GOVERNING_LAW || "",
  /** The city or district whose courts hear a dispute, as it should read after "the courts of". */
  jurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION || "",
  /** Where the servers are, in plain words ("Singapore", "the European Union"). */
  hostingRegion: process.env.NEXT_PUBLIC_LEGAL_HOSTING_REGION || "",
  /** The date the legal pages were last changed, as it should be read ("9 October 2026"). */
  updated: process.env.NEXT_PUBLIC_LEGAL_UPDATED || "",
};

// The header's menu. A "#…" target is a section of the landing page (the
// header and footer prefix it with "/" everywhere else). Features opens the
// features menu: every group, numbered, with its features under it; `spy` is
// the landing-page section that lights it up.
export const NAV: { label: string; href: string; menu?: "features"; spy?: string }[] = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "/features", menu: "features", spy: "#areas" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

// The first screen. A gym owner who has never heard of us reads this and
// nothing else, so it says what GymsPilotPro does for them in one breath.
export const HERO = {
  eyebrow: "Fees, check-in, classes and your own website",
  title: ["Run your whole", "gym from", "one place."],
  lead: "Collect fees on time, check members in, fill your classes and get your own gym website. One simple system, set up for you in a day.",
  primary: { label: "Book a demo", href: "#demo" },
  secondary: { label: "See how it helps", href: "#areas" },
  trust: ["Free trial on every plan", "Set up for you", "Cancel any time"],
};

// What changes for the gym, in the owner's words: one outcome and one
// sentence each. Each card leads to the feature behind it; the full list is
// on /features. Every line is something the product does today.
export const BENEFITS: { eyebrow: string; title: string; text: string; items: { key: FeatureKey; /** Its tab in the carousel: a word or two. */ tab: string; title: string; text: string }[]; cta: string } = {
  eyebrow: "How it helps",
  title: "What changes for your gym",
  text: "Less chasing and less paperwork. More members and fuller classes.",
  items: [
    { key: "renewals", tab: "Get paid", title: "Get paid on time", text: "See who has paid and who owes. Members get a payment link and pay by card, JazzCash, Easypaisa or bank transfer." },
    { key: "alerts", tab: "Check-in", title: "No more unpaid visits", text: "Members check in by QR code or fingerprint, and the desk hears “Fee expired” when a lapsed member walks in." },
    { key: "website", tab: "New members", title: "Win new members", text: "Your own website with your classes, trainers and prices, where people sign up." },
    { key: "booking", tab: "Classes", title: "Fill your classes", text: "Members book classes and personal training from their phone and get a reminder." },
    { key: "messaging", tab: "Win back", title: "Bring members back", text: "Reach members by email and phone notification when a fee is due or they stop coming." },
    { key: "dailysales", tab: "Numbers", title: "Know your numbers", text: "Each day's sales and your profit and loss, without a spreadsheet." },
  ],
  cta: "View all features",
};

export const WHAT_YOU_GET: { eyebrow: string; title: string; text: string; parts: { title: string; text: string }[] } = {
  eyebrow: "What you get",
  title: "Three things, set up together",
  text: "No separate website company, app and spreadsheet. One setup, under your gym's name.",
  parts: [
    { title: "The system behind your desk", text: "Sign-ups, fees, check-in, classes, staff and reports in one place." },
    { title: "Your own gym website", text: "On your own web address, with your logo and colours." },
    { title: "A member portal", text: "Members book, pay and check in from their phone. No app store needed." },
  ],
};

// The feature list is in content/features.ts: the landing page shows the six
// outcomes above, /features shows every feature.

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "Up and running in a day",
  text: "Three steps. We do the technical part.",
  note: "No web address yet? We give you one when we set your gym up, and connect your own later.",
};

export const STEPS = [
  {
    title: "We set up your gym",
    text: "Tell us your gym's name and pick a plan. Within one working day you have your own website, member portal and admin area.",
  },
  {
    title: "We connect your web address",
    text: "Have a domain like yourgym.com? Tell us after you sign up. Our team connects it for you, padlock included.",
  },
  {
    title: "Start selling",
    text: "Add your classes and prices, bring in your members, and take your first payment.",
  },
];

// The invitation to tell us what would make GymsPilotPro easier, on the
// landing page and /features. It opens the contact form with the message
// started (DemoForm reads ?topic=), and WhatsApp when a number is set.
const SUGGESTION_TOPIC = "suggestion";
export const SUGGESTIONS = {
  eyebrow: "Built with you",
  /** The heading; `highlight` follows it, drawn in colour. */
  title: "Your ideas,",
  highlight: "built free",
  text: "We welcome your suggestions. If anything in GymsPilotPro could be simpler or friendlier for you, tell us. We are pleased to build improvements at no extra cost.",
  points: [
    { title: "Tell us what would help", text: "Message us about anything that could be simpler or quicker for you." },
    { title: "We plan it with you", text: "We reply and work out the details, so it fits how your gym runs." },
    { title: "Free for every gym", text: "When it is ready, every gym on GymsPilotPro gets it, with nothing added to your bill." },
  ],
  cta: { label: "Share a suggestion", href: `/contact?topic=${SUGGESTION_TOPIC}` },
  topic: SUGGESTION_TOPIC,
  /** What the contact form's message starts with when opened from here. */
  prefill: "Suggestion: ",
  whatsapp: "Suggest on WhatsApp",
  whatsappUrl: SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hi GymsPilotPro, I have a suggestion: ")}` : "",
};

export const PRICING = {
  eyebrow: "Pricing",
  title: "One price. The whole product.",
  text: "Every plan is the whole product. Plans differ only by the size of your gym, and each starts with a free trial.",
  included: [
    { text: "Your own website & web address", feature: "website" },
    { text: "Fee collection, expiry lists & dues", feature: "feedesk" },
    { text: "Check-in with spoken fee alerts", feature: "alerts" },
    { text: "Class & PT booking", feature: "booking" },
    { text: "Fee reminders with a link to pay online", feature: "billing" },
    { text: "Daily sales & profit and loss", feature: "dailysales" },
  ] as Linked[],
  // Under the plans, wherever the native app is sold or given away.
  appNote: "The native member app is not in the App Store or Google Play yet. Ask us where it stands before you add it. Every plan includes the member portal in the browser.",
  // The price list loaded and is empty.
  fallback: "Plans are being set up. Book a demo and we will send you a quote the same day.",
  // The price list would not load, after trying again by itself.
  unavailable: "We could not load the prices just now. Try again in a moment, or ask us and we will send them to you.",
};

// Customer quotes. Only entries with `sample: false` are shown (see
// components/marketing/Testimonials.tsx); the samples below are placeholders
// for the layout and stay hidden until real quotes replace them. Attributed
// to roles on purpose: no invented names.
export const TESTIMONIALS: { quote: string; who: string; where: string; sample: boolean }[] = [
  {
    quote: "We stopped chasing renewals. Cards renew on their own, bank transfers land with a receipt, and the desk sees who has lapsed before they walk in.",
    who: "Owner",
    where: "Boutique strength studio",
    sample: true,
  },
  {
    quote: "Members book from their phone, the waitlist promotes itself and instructors see their list. Our front desk finally does front desk work.",
    who: "General manager",
    where: "Multi-room fitness club",
    sample: true,
  },
  {
    quote: "Our website is on our own domain with our colours, and it ranks for the town name. It looks like ours because it is.",
    who: "Marketing lead",
    where: "Yoga & pilates studio",
    sample: true,
  },
];

// The first six are what a gym owner asks before anything else and show on
// the landing page at once; those marked `more` sit behind "More questions".
export const FAQ: { q: string; a: string; more?: boolean }[] = [
  {
    q: "How do members pay?",
    a: "Online, you pick one way in Settings → Payments. Safepay, in Pakistan: card, JazzCash, Easypaisa or any bank app, with a reminder and a link to pay before the due date, on it and on the last day, and automatic card payments for members who agree, if you switch them on. Stripe: cards, where Stripe is available to your business. Generic, in any country: before the due date, on it and on the last day the member gets a link with your bank QR code and account details, sends a bank transfer and uploads a screenshot, and your staff approve it. There is no gateway fee, but each receipt is checked by hand. At the desk you record cash, bank transfer, wallet or card-machine payments, part payments included; these are recorded, not processed.",
  },
  {
    q: "Does the money go to my account?",
    a: "Yes, straight to your gym, whichever way you pick. Safepay and Stripe pay into your own account with them, and on to your bank; a Generic bank transfer goes straight to your bank account. GymsPilotPro never holds the money and takes no cut of it. Safepay and Stripe take their own fee on each payment; a bank transfer has no gateway fee. To open a Safepay account you need your CNIC, an NTN from FBR and a bank account certificate.",
  },
  {
    q: "Can I bring my existing members across?",
    a: "Yes. Import members, memberships and expiry dates from a CSV exported from your old software, and check the preview before anything is saved. Members without an email address come across too, and existing plans keep their renewal dates.",
  },
  {
    q: "Do members need to download an app?",
    a: "No. Every plan includes the member portal. It opens in the browser on iPhone, Android and desktop, members add it to their home screen like an app, and it receives push notifications. A native member app is a separate add-on on Starter and Growth, and comes with Pro. It is not in the App Store or Google Play yet.",
  },
  {
    q: "Is my data mixed with other gyms?",
    a: "No. Every gym gets its own database. Members, payments, attendance and messages live only there. You can export your members, payments and reports from the admin panel at any time.",
  },
  {
    q: "Is there a contract?",
    a: "Plans are monthly or yearly and can be cancelled any time. Every plan starts with a free trial. The native member app is an add-on on Starter and Growth, and comes with Pro.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Tell us your domain after you sign up and our team connects it for you, padlock (SSL) included. Your website, member portal and admin panel all live on it.",
    more: true,
  },
  {
    q: "What about the front desk hardware?",
    a: "Any tablet or PC with a browser becomes a check-in kiosk: it scans members' QR codes with its camera or takes a typed member ID. For fingerprints there is a Windows desk app that works with DigitalPersona USB readers; our team installs it on your front-desk PC. Wall-mounted fingerprint machines are not supported, and check-in needs an internet connection. Both play a different sound for each kind of check-in and can say “Fee expired, please renew” out loud.",
    more: true,
  },
  {
    q: "I am already a customer. Where do I sign in?",
    a: "At your gym's own web address, not on this site. We send it to you when your gym is set up: open it and press Sign in. Lost it? Message us and we will send it again.",
    more: true,
  },
];

export const DEMO_FORM = {
  eyebrow: "Book a demo",
  title: "See GymsPilotPro running on a gym like yours",
  text: "Tell us a little about the gym and we will set up a walkthrough on your numbers: memberships, timetable, billing and the website.",
  sizes: ["Under 100 members", "100 to 500 members", "500 to 2,000 members", "2,000+ members"],
};

// The contact page (/contact): the same form, asked as a question. It is the
// way to reach us that always works, whatever else is or is not set.
export const CONTACT = {
  eyebrow: "Contact us",
  title: "Talk to us",
  text: "Ask a question, book a demo or get help with a sign-up. Fill in the form and we reply by email or phone.",
  whatsapp: "Message us on WhatsApp",
  // A gym's staff and members sign in on the gym's own website. This site
  // only has the platform's sign-in, which is no use to them.
  existing: "Already a customer? Sign in at your gym's own web address, not here. Lost it? Message us and we will send it again.",
};

export const FOOTER = {
  blurb: "Gym management software with a private database, your own domain and every feature included.",
  columns: [
    { title: "Product", links: NAV },
    {
      title: "For gyms",
      links: [
        { label: "All features", href: "/features" },
        { label: "Book a demo", href: "#demo" },
        { label: "Contact us", href: "/contact" },
        { label: "Pricing", href: "#pricing" },
        { label: "Member app", href: "/features/member-app" },
      ],
    },
    {
      title: "Customers",
      note: CONTACT.existing,
      links: [{ label: "Help signing in", href: "/contact" }],
    },
  ] as { title: string; note?: string; links: { label: string; href: string }[] }[],
  // For GymsPilotPro's own staff. One quiet link, so nobody takes it for theirs.
  platform: { label: "Platform sign in", href: "/login" },
  // The small print, on the footer's last line on every page.
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Members' data", href: "/privacy#members-data" },
    { label: "Refunds & cancelling", href: "/refund-policy" },
  ],
};
