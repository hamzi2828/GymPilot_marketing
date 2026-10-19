// The legal pages: /terms, /privacy and /refund-policy.
//
// DRAFTS. They are written to match what the product does today, but nobody
// qualified has reviewed them, and several lines are business decisions the
// owner has to confirm before the site sells to anyone: the refund rules,
// the notice periods, the liability cap, how long data is kept after a gym
// leaves. Each of those is marked "DECISION" below.
//
// Honesty rule, as everywhere on this site: every factual line here is
// something the code does (GymPilot_backend, SECURITY_AND_DATA.md). When the
// product changes, change the line. If you are not sure a line is still
// true, take it out.
//
// The seller's name, address, email, governing law and courts are not in
// this file. They come from the environment (LEGAL in content/site.ts) and a
// line that needs one is left out until it is set.

import { GA_ID, META_PIXEL_ID } from "@/lib/analytics";
import { LEGAL, SITE } from "./site";

/** A paragraph, or a list of short points. */
export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  /** The anchor: /privacy#members-data. Never change a published one. */
  id: string;
  /** A small label above the heading, where a page has more than one part. */
  kicker?: string;
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  slug: "terms" | "privacy" | "refund-policy";
  /** Short name, for the footer and the links between the pages. */
  name: string;
  title: string;
  /** One or two sentences under the title. */
  lead: string;
  /** For search results. */
  description: string;
  sections: LegalSection[];
}

/** Only the lines that are there: a missing fact leaves no gap. */
const present = <T,>(items: (T | false | "" | null | undefined)[]): T[] => items.filter(Boolean) as T[];

const NAME = SITE.name;

// The trackers that are switched on in this deployment (lib/analytics.ts),
// so the privacy policy names exactly what the site loads -- and says there
// are none when there are none.
const TRACKERS = present<string>([GA_ID && "Google Analytics", META_PIXEL_ID && "the Meta Pixel"]);
const TRACKER_OWNERS = present<string>([GA_ID && "Google", META_PIXEL_ID && "Meta"]);

/* --------------------------------- terms --------------------------------- */

const TERMS: LegalDoc = {
  slug: "terms",
  name: "Terms of Service",
  title: "Terms of Service",
  lead: `The agreement between your gym and ${NAME}. Short version: you pay for a plan, we run the software, and your gym's data stays yours.`,
  description: `The terms a gym agrees to when it uses ${NAME}: the free trial, payment, cancelling, your data and what each side is responsible for.`,
  sections: [
    {
      id: "who",
      heading: "Who this is between",
      blocks: present<LegalBlock>([
        `"We" and "us" mean ${NAME}. "You" means the gym or business that signs up, and the person who signs up for it.`,
        LEGAL.name && `${NAME} is provided by ${LEGAL.name}${LEGAL.address ? `, ${LEGAL.address}` : ""}.`,
        "By starting a trial, paying for a plan or using the service, you agree to these terms.",
      ]),
    },
    {
      id: "service",
      heading: "What you get",
      blocks: [
        `${NAME} is software you use over the internet. Your gym gets a website, a member portal that works in the browser, and the management system behind the desk.`,
        "Each plan has limits on members, staff, trainers and classes. The pricing page shows them. Some things are add-ons with their own price.",
        "The service needs an internet connection. It does not work offline.",
      ],
    },
    {
      id: "account",
      heading: "Your account",
      blocks: [
        {
          list: [
            "Give us correct details when you sign up.",
            "Keep your passwords safe. Give each staff member their own account.",
            "You are responsible for what is done with your gym's accounts.",
            "Tell us quickly if you think someone else has got in.",
          ],
        },
      ],
    },
    {
      id: "trial",
      heading: "Free trial",
      blocks: [
        "Every plan starts with a free trial. The pricing page and the checkout show how many days.",
        "If you sign up with a card, the card is saved but not charged during the trial. The first charge is on the day the trial ends, unless you cancel before then.",
        "If you sign up without a card, nothing is charged until you agree a way to pay with us.",
      ],
    },
    {
      id: "payment",
      heading: "Price and payment",
      blocks: [
        "Prices are on the pricing page. You pay monthly or yearly, in advance.",
        "Card payments are taken by Stripe on its own secure page. We never see or store your full card number.",
        "Where card payment is not offered, we agree another way with you: bank transfer, JazzCash or Easypaisa.",
        "Your plan renews by itself each month or year until you cancel.",
        // DECISION: the notice period for a price rise.
        "We may change our prices. We will tell you by email at least 30 days before a new price applies to you.",
      ],
    },
    {
      id: "late",
      heading: "Late or failed payment",
      blocks: [
        "If a payment fails or is late, we tell you by email.",
        "If it stays unpaid after a short grace period, your gym's website and admin area stop working until you pay. The owner can still sign in to pay.",
        "We do not delete your data just because a payment is late.",
      ],
    },
    {
      id: "cancel",
      heading: "Cancelling",
      blocks: [
        "You can cancel at any time. There is no minimum contract.",
        "If you pay by card, cancel under Settings → Billing → Manage billing in your admin area. Otherwise, message us.",
        "Refunds are covered in our Refund and Cancellation Policy.",
      ],
    },
    {
      id: "data",
      heading: "Your data",
      blocks: [
        "Your gym's data belongs to you. We use it only to run the service for you.",
        "You can export your members, payments and reports from your admin area at any time.",
        "Our Privacy Policy explains what is stored, where, and how it is deleted.",
      ],
    },
    {
      id: "members",
      heading: "Your members' data",
      blocks: [
        "You decide what you collect about your members, and why. In data protection terms you are the controller and we are your processor.",
        {
          list: [
            "Collect only what you have the right to collect.",
            "Tell your members how you use their details.",
            "Take a fingerprint only when the member has truly agreed. The system will not save one until that agreement is recorded.",
            "Answer your members when they ask to see, correct or delete their details. We will help you.",
          ],
        },
      ],
    },
    {
      id: "other-services",
      heading: "Services you connect",
      blocks: [
        "Some features use an account you hold with someone else: Safepay or Stripe for your members' online payments, an SMS or WhatsApp provider, your email server, your domain name.",
        "Those accounts, their charges and their rules are between you and that provider.",
      ],
    },
    {
      id: "use",
      heading: "Fair use",
      blocks: [
        {
          list: [
            "Do not use the service to break the law.",
            "Do not send messages to people who have not agreed to get them.",
            "Do not try to get into another gym's data or disturb the service.",
            "Do not resell the service unless we have agreed it in writing.",
          ],
        },
      ],
    },
    {
      id: "availability",
      heading: "Availability and support",
      blocks: [
        "We work to keep the service running all day, every day, but we cannot promise it will never be interrupted.",
        "Support is through the channels listed on your plan.",
      ],
    },
    {
      id: "liability",
      heading: "If something goes wrong",
      blocks: [
        "We provide the service with reasonable care. It comes as it is, without any other promise.",
        // DECISION: the cap. Twelve months of fees is a common default.
        "As far as the law allows, the most we owe you for any claim is what you paid us in the 12 months before it.",
        "We are not responsible for losses we could not reasonably have expected, or for services you connect yourself.",
        "Nothing here takes away rights the law says cannot be taken away.",
      ],
    },
    {
      id: "ending",
      heading: "Ending the agreement",
      blocks: [
        "You can stop using the service at any time by cancelling.",
        "We may suspend or close an account that breaks these terms or stays unpaid. We will tell you by email first, unless the law or an urgent risk stops us.",
        "When the agreement ends, download your data. Ask us and we will delete what we hold.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      blocks: ["If we change these terms, we post the new version on this page. For a change that matters, we also email the gym's owner before it applies."],
    },
    ...(LEGAL.governingLaw || LEGAL.jurisdiction
      ? [
          {
            id: "law",
            heading: "Which law applies",
            blocks: present<LegalBlock>([
              LEGAL.governingLaw && `These terms follow the laws of ${LEGAL.governingLaw}.`,
              LEGAL.jurisdiction && `A dispute we cannot settle between us goes to the courts of ${LEGAL.jurisdiction}.`,
            ]),
          },
        ]
      : []),
  ],
};

/* -------------------------------- privacy -------------------------------- */

const PRIVACY: LegalDoc = {
  slug: "privacy",
  name: "Privacy Policy",
  title: "Privacy Policy",
  lead: `What ${NAME} collects, why, and where it is kept. The first part is about this website. The second is about the members of gyms that use ${NAME}.`,
  description: `What ${NAME} collects on this website, and how gym members' data and fingerprint templates are stored, protected, exported and deleted.`,
  sections: [
    {
      id: "who",
      heading: "Who we are",
      blocks: present<LegalBlock>([
        `${NAME} is gym management software.`,
        LEGAL.name && `It is provided by ${LEGAL.name}${LEGAL.address ? `, ${LEGAL.address}` : ""}.`,
        "This page covers two different things, so it has two parts.",
      ]),
    },

    /* -- Part 1: this website -- */
    {
      id: "website",
      kicker: "Part 1 · This website",
      heading: "What we collect from you",
      blocks: [
        "We collect only what you type into a form on this site.",
        {
          list: [
            "Demo request: your name, email, phone, gym name, gym size, city or country, and your message.",
            "Sign-up: the same, plus the plan you chose, the web address you would like and your browser's time zone.",
            "With either form we also keep the page it was sent from, your IP address and your browser type. This helps us stop spam.",
          ],
        },
        "If you pay by card, you type the card on Stripe's page, not ours. We never see or store the full card number. Stripe tells us that you paid and gives us a reference for your subscription.",
      ],
    },
    {
      id: "use",
      kicker: "Part 1 · This website",
      heading: "What we use it for",
      blocks: [
        {
          list: ["To reply to you and arrange a demo.", "To set up your gym.", "To bill you for your plan and write to you about it."],
        },
        "Your request is emailed to our own team. We do not sell your details or pass them to advertisers.",
        "Ask us and we will delete a request you sent.",
      ],
    },
    {
      id: "cookies",
      kicker: "Part 1 · This website",
      heading: "Cookies",
      blocks: [
        ...(TRACKERS.length
          ? [
              `We use ${TRACKERS.join(" and ")} to count visits and to see which adverts bring people here.`,
              `${TRACKERS.length > 1 ? "They set" : "It sets"} cookies in your browser and ${TRACKERS.length > 1 ? "tell" : "tells"} ${TRACKER_OWNERS.join(" and ")} which pages you open and when you send a form or start a sign-up. What you type into our forms is not sent to ${TRACKERS.length > 1 ? "them" : "it"}.`,
              "You can block these cookies in your browser's settings or with an ad blocker. The site still works.",
            ]
          : ["This website does not set cookies for visitors, and has no analytics or advertising trackers."]),
        "The checkout keeps what you typed in your own browser while you are on the payment page, so it is still there if you come back. It is cleared when you finish, and gone when you close the tab.",
        "Our hosting provider keeps ordinary server logs, such as IP addresses, to run and protect the site.",
      ],
    },

    /* -- Part 2: gym members' data -- */
    {
      id: "members-data",
      kicker: "Part 2 · Gym members' data",
      heading: "Whose data it is",
      blocks: [
        `A gym that uses ${NAME} keeps its members' details in it. That data belongs to the gym and its members, not to us.`,
        `The gym decides what it collects and why. In data protection terms the gym is the controller. ${NAME} is the processor: we store and handle the data for the gym, on the gym's instructions.`,
        "If you are a member, ask your gym first. It can show you, correct or delete your details. We help the gym do that.",
      ],
    },
    {
      id: "what-is-stored",
      kicker: "Part 2 · Gym members' data",
      heading: "What is stored",
      blocks: [
        "What a gym can keep about a member:",
        {
          list: [
            "Name, phone, email if given, username, date of birth, gender, address and photo.",
            "Emergency contact, health questionnaire answers, the signed agreement and uploaded documents.",
            "Memberships, payments, invoices and any balance owed.",
            "If the member chose automatic payments, a reference to their saved card and a record of their consent (see below).",
            "Class and personal training bookings, and check-in visits.",
            "Messages the gym sent, and the member's notification choices.",
            "Notes written by staff.",
            "A fingerprint template, only if the member agreed (see below).",
          ],
        },
        "Passwords are stored only as a one-way hash. Nobody can read them, including us.",
        `Card numbers are never stored by ${NAME}. Members pay online on the page of the gym's own payment provider: Safepay, or Stripe.`,
        "For staff and trainers the gym can also keep rotas, leave, pay and payslips.",
      ],
    },
    {
      id: "saved-cards",
      kicker: "Part 2 · Gym members' data",
      heading: "Saved cards and automatic payments",
      blocks: [
        "Automatic payments are optional. A member who wants them saves a card when they pay online, and ticks a box to agree to it. Nothing is saved without that.",
        {
          list: [
            `The card is stored by Safepay, the gym's payment provider, not by ${NAME}. The member types it on Safepay's page, not ours.`,
            `${NAME} keeps only Safepay's reference to the card, with its brand, last four digits and expiry date, so the member can see which card it is. The reference is stored encrypted.`,
            "It also keeps a record of the member's consent: the words they agreed to, and when.",
            "The card is charged only for that member's membership at that gym, on each due date, as the consent says.",
            `The member can turn automatic payments off at any time in their account. ${NAME} then removes its reference to the card and does not charge it again.`,
          ],
        },
        "What Safepay keeps, and for how long, is covered by Safepay's own terms and privacy policy.",
      ],
    },
    {
      id: "fingerprints",
      kicker: "Part 2 · Gym members' data",
      heading: "Fingerprints",
      blocks: [
        "Fingerprint check-in is optional. A gym can use QR codes or member IDs instead.",
        {
          list: [
            "Nothing is stored until the person has agreed. They agree on their own account page, on a signed form the gym records, or at the desk when the finger is enrolled.",
            "We store a template: a set of numbers worked out from the finger on the gym's desk computer. We do not store a picture of the fingerprint.",
            "The template is stored encrypted, with a different key for each gym.",
            "It is used for one thing only: to recognise that person when they check in at that gym's desk.",
            "It is deleted when the person withdraws their agreement, when their account is deleted, or when the gym removes it.",
            "It is deleted with everything else when a gym's data is deleted.",
          ],
        },
        "To check a finger, the gym's desk computer receives that gym's templates over a signed-in, encrypted connection. They are not shared with anyone else.",
      ],
    },
    {
      id: "hosting",
      kicker: "Part 2 · Gym members' data",
      heading: "Where it is kept",
      blocks: present<LegalBlock>([
        "Every gym has its own database. One gym's data is never mixed with another's.",
        "The software runs on Vercel. The databases are MongoDB databases in the cloud. Uploaded files are kept in Vercel's file storage.",
        LEGAL.hostingRegion && `The servers are in ${LEGAL.hostingRegion}.`,
        "Data travels between your browser and our servers over an encrypted connection (HTTPS).",
      ]),
    },
    {
      id: "security",
      kicker: "Part 2 · Gym members' data",
      heading: "How it is protected",
      blocks: [
        {
          list: [
            "Staff see only what their role allows.",
            "Two-step sign-in by email is available, and a gym can require it for all staff.",
            "Changes made by staff are written to an audit log.",
            "Sign-in and password reset are limited to slow down guessing.",
            "The secret keys the gym saves for Safepay, Stripe, email and messaging are stored encrypted.",
          ],
        },
        "No system is perfectly safe. If we learn of a breach that affects a gym's data, we tell that gym without delay.",
      ],
    },
    {
      id: "others",
      kicker: "Part 2 · Gym members' data",
      heading: "Who else handles it",
      blocks: [
        "We use these companies to run the service:",
        { list: ["Vercel, for running the software and storing files.", "MongoDB, for the databases.", "An email provider, for the emails we send ourselves."] },
        "A gym can also switch on services of its own. Data goes to them only when the gym sets them up:",
        {
          list: [
            "Safepay, for payments by card, JazzCash, Easypaisa or bank app, through the gym's own Safepay account. It also stores a card a member saves for automatic payments.",
            "Stripe, for card payments, through the gym's own Stripe account.",
            "The gym's own email server, for emails to members.",
            "The gym's own SMS or WhatsApp provider, for text messages.",
            "Push notification services, for alerts on a member's phone or browser.",
            "Google, if the gym offers Sign in with Google and the member uses it.",
          ],
        },
        "We do not sell members' data, and we do not use it for advertising.",
      ],
    },
    {
      id: "member-rights",
      kicker: "Part 2 · Gym members' data",
      heading: "What a member can do",
      blocks: [
        {
          list: [
            "Download a copy of their own data from their account page.",
            "Change their own details.",
            "Choose which messages they get, or turn them off.",
            "Turn automatic payments off, which removes their saved card from their account.",
            "Withdraw their fingerprint agreement. The stored templates are then deleted.",
            "Ask the gym to correct or delete their account.",
          ],
        },
      ],
    },
    {
      id: "export-delete",
      kicker: "Part 2 · Gym members' data",
      heading: "How a gym exports or deletes its data",
      blocks: [
        "To export: download the gym's members, payments and reports from the admin area, as CSV or Excel.",
        "To delete one member: delete their account in the admin area. Their fingerprint templates go with it.",
        // DECISION: the 30 days, and how long a closed gym's data is kept when nobody asks.
        "To delete everything: write to us from the owner's email address. We delete the gym's database within 30 days, and confirm when it is done.",
        "We keep a gym's data for as long as the gym is a customer. We do not delete it the moment a plan ends, so a gym can come back. Ask us and we will delete it sooner.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      blocks: ["If we change this policy, we post the new version on this page."],
    },
  ],
};

/* ----------------------------- refund policy ----------------------------- */

// DECISION: every rule on this page is a default the owner has to confirm.
// It is written to fit what the product does: a free trial on every plan,
// monthly or yearly billing in advance, and refunds made by hand.
const REFUNDS: LegalDoc = {
  slug: "refund-policy",
  name: "Refund and Cancellation Policy",
  title: "Refund and Cancellation Policy",
  lead: "Try it free first. Cancel whenever you like. Here is exactly when you get money back.",
  description: `How to cancel a ${NAME} plan and when a payment is refunded: the free trial, monthly plans, yearly plans and payments taken by mistake.`,
  sections: [
    {
      id: "trial",
      heading: "The free trial",
      blocks: [
        "Every plan starts with a free trial. Nothing is charged during it.",
        "Cancel before the trial ends and you pay nothing.",
        "If you added a card, it is first charged on the day the trial ends. The checkout shows you that date and the amount before you agree.",
      ],
    },
    {
      id: "cancel",
      heading: "How to cancel",
      blocks: [
        "You can cancel at any time. There is no minimum contract.",
        {
          list: [
            "Paying by card: open Settings → Billing → Manage billing in your admin area and cancel there.",
            "Paying by bank transfer, JazzCash or Easypaisa: message us and we will stop the plan.",
          ],
        },
        "After you cancel, nothing more is charged. You keep the service until the end of the period you have already paid for.",
      ],
    },
    {
      id: "monthly",
      heading: "Monthly plans",
      blocks: ["A month that has started is not refunded. Cancel and the plan simply does not renew."],
    },
    {
      id: "yearly",
      heading: "Yearly plans",
      blocks: [
        "Changed your mind? Ask within 14 days of a yearly payment and we refund that payment in full.",
        "After 14 days a yearly payment is not refunded. Your plan runs to the end of the year you paid for.",
      ],
    },
    {
      id: "always",
      heading: "When we always refund",
      blocks: [
        {
          list: [
            "You were charged twice, or charged the wrong amount.",
            "You paid, and we could not set your gym up.",
            "We close the service to you for a reason that is not your fault. We refund the full months you have paid for and not used.",
          ],
        },
      ],
    },
    {
      id: "how",
      heading: "How to ask, and how you are paid back",
      blocks: [
        "Write to us with your gym's name and the date of the payment.",
        "Refunds are made by a person, not automatically. We answer within 7 working days.",
        "The money goes back the way you paid. A card refund can take your bank up to 10 working days to show.",
      ],
    },
    {
      id: "data",
      heading: "Your data when you leave",
      blocks: [
        "Before you go, export your members, payments and reports from your admin area.",
        "We do not delete it the moment your plan ends. Ask us and we will delete it. Our Privacy Policy explains how.",
      ],
    },
    {
      id: "members",
      heading: "Your members' payments",
      blocks: [`This policy is about what your gym pays ${NAME}. What a member pays your gym is between you and the member. That money goes to you, not through us, and your own refund rules apply.`],
    },
  ],
};

export const LEGAL_DOCS: LegalDoc[] = [TERMS, PRIVACY, REFUNDS];

export function legalDoc(slug: LegalDoc["slug"]): LegalDoc {
  return LEGAL_DOCS.find((d) => d.slug === slug)!;
}
