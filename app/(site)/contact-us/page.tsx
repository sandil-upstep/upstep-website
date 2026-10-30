import type { Metadata } from "next";
import { InfoHero, InfoPage } from "@/components/info/InfoPage";
import ContactDetails from "@/components/contact/ContactDetails";
import ContactForm from "@/components/contact/ContactForm";
import "@/components/contact/contact.scss";

export const metadata: Metadata = {
  title: "Contact Us · Upstep Academy",
  description:
    "Get in touch with Upstep Academy: send us a message, or reach our Mumbai and New York offices by phone or email.",
};

export default function ContactUsPage() {
  return (
    <InfoPage>
      <InfoHero
        eyebrow="Contact us"
        title="We’d love to hear from you"
        lead="Questions about our classes, courses or your child’s progress? Send us a message, or reach our team directly."
      />

      <section className="contact-section">
        <div className="contact-card">
          <ContactForm />
        </div>
        <aside className="contact-card contact-card--details" aria-label="Contact details">
          <ContactDetails />
        </aside>
      </section>
    </InfoPage>
  );
}
