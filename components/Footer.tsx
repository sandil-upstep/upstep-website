import Image from "next/image";
import Link from "next/link";
import "./footer.scss";

// The site's footer: who Upstep is, where its students are, how to reach it,
// and the policies. Navy like the dark sections, on the same grid lines.
// Policy pages live on the main site until they're built here.

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/upstepacademy.official" },
  { label: "Instagram", href: "https://www.instagram.com/upstepacademy.official" },
  { label: "YouTube", href: "https://www.youtube.com/@upstepacademy.official" },
];

export const COUNTRIES = [
  "India",
  "USA",
  "Australia",
  "Singapore",
  "Qatar",
  "Canada",
  "UAE",
  "New Zealand",
  "Oman",
  "Germany",
  "Netherlands",
  "Switzerland",
  "UK",
  "Sweden",
  "Saudi Arabia",
  "Malaysia",
  "Hong Kong",
];

export const OFFICES = [
  {
    country: "India",
    address: "505, Town Center 2, Andheri–Kurla Rd, Marol, Andheri East, Mumbai 400059",
    phone: "+91 98202 84767",
    tel: "+919820284767",
  },
  { country: "USA", address: "136 Madison Avenue, New York, NY", phone: "+1 347-343-4700", tel: "+13473434700" },
];

const LEGAL = [
  { label: "Privacy", href: "https://www.upstepacademy.com/privacypolicy/" },
  { label: "Terms", href: "https://www.upstepacademy.com/terms-of-service/" },
  { label: "Refunds", href: "https://www.upstepacademy.com/refund-policy/" },
  { label: "Cancellation", href: "https://www.upstepacademy.com/cancellation-policy/" },
  { label: "Contact", href: "https://www.upstepacademy.com/contact-us/" },
];

export default function Footer() {
  return (
    <footer className="site-footer" data-nav-theme="dark">
      <div className="site-footer__lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link href="/" aria-label="Upstep Academy home" className="site-footer__home">
              <Image src="/images/main-logo.svg" alt="Upstep Academy" width={120} height={40} className="site-footer__logo" />
            </Link>
            <p>A global leader in online chess training since 2020, known for a personalised, innovative approach to teaching.</p>
            <ul className="site-footer__social" aria-label="Upstep Academy on social media">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__col">
            <h2 className="site-footer__heading">Students in {COUNTRIES.length} countries</h2>
            <p className="site-footer__countries">{COUNTRIES.join(" · ")}</p>
          </div>

          <div className="site-footer__col">
            <h2 className="site-footer__heading">Contact</h2>
            {OFFICES.map((o) => (
              <address key={o.country} className="site-footer__office">
                <span>{o.address}</span>
                <a href={`tel:${o.tel}`}>
                  {o.phone} · {o.country}
                </a>
              </address>
            ))}
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} Upstep Education Private Limited</p>
          <ul className="site-footer__legal" aria-label="Policies">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
