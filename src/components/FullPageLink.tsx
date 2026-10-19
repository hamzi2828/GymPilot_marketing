// A link that loads a whole new page instead of moving inside this one, as
// <Link> does. For crossing between the marketing site and the platform
// panel (/login, /forgot, /reset, /super-admin): each side has its own
// Content-Security-Policy (next.config.ts) and only the site runs analytics,
// so arriving on the other side must be a fresh page under its own policy --
// never the panel inside a marketing page whose trackers are still loaded.

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function FullPageLink({ children, ...props }: Props) {
  return <a {...props}>{children}</a>;
}
