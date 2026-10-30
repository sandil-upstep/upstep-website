import type { Metadata } from "next";
import { InfoHero, InfoPage } from "@/components/info/InfoPage";
import { LegalDoc, type LegalSectionData } from "@/components/info/LegalDoc";

export const metadata: Metadata = {
  title: "Refund Policy · Upstep Academy",
  description:
    "Upstep Academy’s Refund Policy: when payments are final, the credits and accommodations Upstep may offer, and how exceptional refunds are calculated.",
};

const SECTIONS: LegalSectionData[] = [
  {
    id: "scope",
    title: "1. Scope",
    body: (
      <p>
        This Refund Policy applies to payments for Services provided by Upstep Academy. It should be read with the Terms
        of Service, Course Terms and Conditions and Cancellation Policy. Capitalised terms have the meanings given in the
        Terms of Service unless stated otherwise.
      </p>
    ),
  },
  {
    id: "no-refund",
    title: "2. No-Refund Policy",
    body: (
      <p>
        Once a payment is made and processed, it is final and non-refundable. A Student or Parent is not entitled to a
        refund because of a change of mind, withdrawal, non-attendance, relocation, scheduling or Coach preference,
        competing commitments, temporary inability to participate, or failure to use classes within the applicable
        package validity period.
      </p>
    ),
  },
  {
    id: "credits",
    title: "3. Credits and Other Accommodations",
    body: (
      <p>
        Upstep may, at its sole discretion and subject to availability, offer rescheduling, a replacement class or Coach,
        an alternative batch, service credit, package extension, transfer or another accommodation. Such accommodation
        does not create a right to a cash refund or a precedent for another case.
      </p>
    ),
  },
  {
    id: "exceptional-refunds",
    title: "4. Exceptional or Legally Required Refunds",
    body: (
      <>
        <p>
          If Upstep expressly agrees in writing to a monetary refund, or a refund is required by applicable mandatory
          law, the amount will be calculated under the Terms of Service. To the fullest extent permitted by law, Upstep
          may first:
        </p>
        <ul>
          <li>
            reverse or adjust discounts, promotions, bundled pricing or other price concessions, and recalculate Services
            already delivered or consumed at the applicable standard or undiscounted rate;
          </li>
          <li>
            deduct payment gateway, transaction, processing, bank, international-payment, intermediary-bank,
            currency-conversion and foreign-exchange charges; and
          </li>
          <li>account for exchange-rate differences or fluctuations between the original payment and the refund.</li>
        </ul>
        <p>
          The amount ultimately received may therefore be less than the amount originally paid. Upstep is not
          responsible for third-party payment charges or foreign-exchange differences except where applicable mandatory
          law requires otherwise.
        </p>
      </>
    ),
  },
  {
    id: "service-disruption",
    title: "5. Upstep-Side Service Disruption",
    body: (
      <p>
        If Upstep cannot deliver a paid Service, it may first provide a replacement, rescheduling, alternative batch or
        Coach, package extension, service credit or another reasonable remedy. A cash refund is not automatic and applies
        only where Upstep expressly agrees in writing or applicable mandatory law requires it.
      </p>
    ),
  },
  {
    id: "payment-disputes",
    title: "6. Payment Disputes",
    body: (
      <p>
        If you believe a payment was charged incorrectly, contact Upstep through its official support or billing
        channels before initiating a chargeback so the matter can be investigated. Genuine rights concerning
        unauthorised, duplicate or incorrectly processed transactions remain unaffected. False or abusive chargebacks may
        be handled under the Terms of Service.
      </p>
    ),
  },
  {
    id: "contact",
    title: "7. Mandatory Rights and Contact",
    body: (
      <p>
        Nothing in this Policy excludes any refund or statutory remedy that cannot lawfully be excluded. For
        refund-related questions, contact Upstep through the official contact details published on{" "}
        <a href="https://www.upstepacademy.com">https://www.upstepacademy.com</a>.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <InfoPage>
      <InfoHero
        eyebrow="Legal"
        title="Refund Policy"
        lead="When payments are final, the accommodations Upstep may offer instead, and how an exceptional refund is calculated."
      />
      <LegalDoc sections={SECTIONS} />
    </InfoPage>
  );
}
