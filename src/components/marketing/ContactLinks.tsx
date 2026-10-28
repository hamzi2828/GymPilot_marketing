import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { FiEdit3, FiMail, FiPhone } from "react-icons/fi";
import { CONTACT, SITE } from "@/content/site";

// Every way to reach us, wherever the site offers contact: WhatsApp, email
// and phone when they are set, and the contact form, which is always there.
// So a page that shows this never leaves a visitor with nobody to ask.
export default function ContactLinks({
  layout = "column",
  form = true,
  className = "",
}: {
  /** Kept for callers; both tones follow the site theme (gp tokens). */
  tone?: "dark" | "light";
  layout?: "column" | "row";
  /** Leave the form link out where the form itself is on the page. */
  form?: boolean;
  className?: string;
}) {
  const link = "inline-flex items-center gap-2 rounded text-gp-mist transition-colors hover:text-gp-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint";
  const whatsapp = "inline-flex items-center gap-2 rounded font-semibold text-gp-mint transition-colors hover:text-gp-mint/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint";

  return (
    <div className={`flex text-sm ${layout === "row" ? "flex-wrap items-center justify-center gap-x-5 gap-y-2" : "flex-col gap-2"} ${className}`}>
      {SITE.whatsappUrl && (
        <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className={whatsapp}>
          <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden="true" /> {CONTACT.whatsapp}
        </a>
      )}
      {SITE.contactEmail && (
        <a href={`mailto:${SITE.contactEmail}`} className={link}>
          <FiMail className="h-4 w-4 shrink-0" aria-hidden="true" /> {SITE.contactEmail}
        </a>
      )}
      {SITE.contactPhone && (
        <a href={`tel:${SITE.contactPhone.replace(/[^\d+]/g, "")}`} className={link}>
          <FiPhone className="h-4 w-4 shrink-0" aria-hidden="true" /> {SITE.contactPhone}
        </a>
      )}
      {form && (
        <Link href="/contact" className={link}>
          <FiEdit3 className="h-4 w-4 shrink-0" aria-hidden="true" /> Use the contact form
        </Link>
      )}
    </div>
  );
}
