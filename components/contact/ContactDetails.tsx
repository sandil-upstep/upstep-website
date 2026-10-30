import type { ReactNode } from "react";
import { OFFICES } from "../Footer";

// The Contact Us page's side card: the offices (the footer's), the phone
// line and the email, each beside an orange round icon.

export const CONTACT_EMAIL = "info@UpstepAcademy.com";

function OfficeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <circle cx="8.5" cy="10.5" r="2" />
      <path d="M5.5 16c.6-1.6 1.6-2.4 3-2.4s2.4.8 3 2.4M14.5 9.5h4M14.5 12.5h4M14.5 15.5h2.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  );
}

function Item({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="contact-item">
      <span className="contact-item__icon">{icon}</span>
      <div>
        <h3 className="contact-item__title">{title}</h3>
        <div className="contact-item__body">{children}</div>
      </div>
    </li>
  );
}

export default function ContactDetails() {
  const [india, ...rest] = OFFICES;
  return (
    <ul className="contact-details">
      <Item icon={<OfficeIcon />} title="Registered Corporate Office">
        <address>{india.address}</address>
      </Item>
      {rest.map((o) => (
        <Item key={o.country} icon={<OfficeIcon />} title={`${o.country} Office`}>
          <address>
            {o.address}
            <br />
            Phone: <a href={`tel:${o.tel}`}>{o.phone}</a>
          </address>
        </Item>
      ))}
      <Item icon={<PhoneIcon />} title="Phone Number">
        <a href={`tel:${india.tel}`}>{india.phone}</a>
      </Item>
      <Item icon={<MailIcon />} title="Email Address">
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </Item>
    </ul>
  );
}
