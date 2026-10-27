import type { Metadata } from "next";
import { InfoHero, InfoPage } from "@/components/info/InfoPage";
import { LegalClause, LegalDoc, LegalTable, type LegalSectionData } from "@/components/info/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy · Upstep Academy",
  description:
    "How Upstep Academy collects, uses, shares, stores and protects personal data, including children’s data, and how to exercise your privacy rights.",
};

const SECTIONS: LegalSectionData[] = [
  {
    id: "about",
    title: "1. About This Privacy Policy",
    body: (
      <>
        <LegalClause title="1.1 Who controls your personal data">
          <p>
            Upstep Academy is a brand operated by Upstep Education Private Limited (“Upstep”, “we”, “us” or “our”). For
            the personal data covered by this Policy, Upstep generally acts as the organisation that determines why and
            how the data is processed, subject to the role of any third-party platform or provider acting independently
            under its own privacy notice.
          </p>
        </LegalClause>
        <LegalClause title="1.2 Scope">
          <p>
            This Policy applies to personal data collected through our Website, inquiry and demo forms, enrollment and
            payment processes, live classes, one-to-one and group coaching, masterclasses, tournaments, LMS and
            chess-learning tools, support channels, WhatsApp/SMS/email communications, recordings and other
            Upstep-controlled Services.
          </p>
        </LegalClause>
        <LegalClause title="1.3 Privacy laws">
          <p>
            Upstep operates internationally. The privacy rules that apply depend on the individual’s location, the
            nature of the Service and the processing involved. This Policy is designed to support compliance with
            applicable privacy and children’s-data laws, including the EU GDPR, UK GDPR and Data Protection Act 2018,
            COPPA and applicable US state privacy laws, India’s Digital Personal Data Protection Act 2023 and Rules 2025
            as relevant provisions come into force, and applicable laws in Canada, Australia, Singapore and the UAE.
          </p>
        </LegalClause>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "2. Personal Data We Collect",
    body: (
      <>
        <p>
          We collect only the categories reasonably relevant to operating the Services, subject to applicable law. The
          exact information varies by Student, programme and platform.
        </p>
        <LegalTable
          head={["Category", "Examples"]}
          rows={[
            [
              "Parent / account information",
              "Name, email, phone number, country, relationship to Student, account credentials, communication preferences and enrollment details.",
            ],
            [
              "Student information",
              "Name, age or date of birth, country/time zone, chess level, rating, federation or platform username where relevant, learning goals and programme information.",
            ],
            [
              "Learning and LMS data",
              "Attendance, schedules, assignments, homework, puzzles, game history, moves, annotations, coach feedback, progress, assessment results, practice activity and LMS interactions.",
            ],
            [
              "Class interaction data",
              "Video/audio participation where enabled, chat, screen sharing, digital-board activity, questions, responses, feedback, support records and authorised recordings.",
            ],
            [
              "Payment and transaction data",
              "Payment status, amount, currency, invoice and transaction references, billing information and limited payment metadata. Complete card credentials are generally handled by payment processors rather than Upstep.",
            ],
            [
              "Achievement and media data",
              "Tournament results, ratings, certificates, rankings, awards, testimonials, photographs or other achievement information where collected or provided.",
            ],
            [
              "Device and website data",
              "IP address, browser/device type, operating system, pages viewed, timestamps, cookie identifiers, approximate location derived from IP, referral information and security logs.",
            ],
            [
              "Communications",
              "Emails, WhatsApp or SMS messages, call notes, support requests, complaints, feedback and other communications with Upstep.",
            ],
            [
              "Safety and integrity data",
              "Fair-play reviews, suspected cheating information, safeguarding reports, account-security events, complaints and relevant evidence where reasonably necessary.",
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "how-we-collect",
    title: "3. How We Collect Personal Data",
    body: (
      <>
        <p>We may collect personal data:</p>
        <ul>
          <li>
            directly from a Parent, adult Student or Student, including through forms, classes, calls, messages and
            support requests;
          </li>
          <li>automatically through the Website, LMS, class platforms and security/analytics technologies;</li>
          <li>
            from Coaches and authorised Upstep personnel who record attendance, progress, feedback, safeguarding or
            support information;
          </li>
          <li>
            from payment processors, video-conferencing providers, chess platforms, tournament organisers or other
            service providers used for the Services;
          </li>
          <li>
            from publicly available chess-rating, tournament or federation sources where relevant to a Student’s chess
            activities; and
          </li>
          <li>from a school, club, partner or other organisation where it has lawful authority to provide the information to us.</li>
        </ul>
      </>
    ),
  },
  {
    id: "why-we-use",
    title: "4. Why We Use Personal Data",
    body: (
      <>
        <p>
          We use personal data only for legitimate and lawful purposes. Depending on the jurisdiction, our legal basis
          may include performance of a contract, steps requested before entering a contract, consent, legitimate
          interests, compliance with legal obligations, protection of vital interests, or other lawful grounds
          recognised by applicable law.
        </p>
        <LegalTable
          head={["Purpose", "Typical uses / basis"]}
          rows={[
            [
              "Deliver the Services",
              "Enrollment, scheduling, classes, LMS access, assignments, Coach feedback, tournament administration and customer support. Usually necessary to perform or administer the educational service.",
            ],
            [
              "Manage Parents and Students",
              "Accounts, authentication, communication preferences, package information, renewals, billing and service administration.",
            ],
            [
              "Improve teaching and products",
              "Quality review, curriculum improvement, analytics, coach training, educational research, feature development and aggregated performance insights, subject to appropriate safeguards.",
            ],
            [
              "Safety, safeguarding and integrity",
              "Protect children and other users, investigate complaints, prevent fraud, cheating or misuse, secure systems and preserve relevant evidence.",
            ],
            [
              "Communicate",
              "Class links, reminders, schedule changes, homework, receipts, service notices, support and, where permitted, marketing or promotional communications.",
            ],
            [
              "Legal and compliance",
              "Tax/accounting records, legal claims, regulatory obligations, responding to lawful requests and enforcing our agreements.",
            ],
            [
              "Achievements and promotion",
              "Recognise Student achievements and, where lawful, publish achievement or testimonial content. Separate consent is obtained where legally required.",
            ],
            [
              "Cookies and analytics",
              "Operate the Website, remember preferences, understand usage, maintain security and, where permitted, measure marketing effectiveness.",
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "childrens-privacy",
    title: "5. Children’s Privacy",
    body: (
      <>
        <p>Children receive enhanced privacy protection.</p>
        <LegalClause title="5.1 Parent involvement">
          <p>
            A Parent or legal guardian should enroll and authorise participation for a Minor. Parents are responsible
            for providing accurate age information and for completing any parental-consent or verification step that
            applicable law requires. We may limit or pause a feature until required consent or verification is
            completed.
          </p>
        </LegalClause>
        <LegalClause title="5.2 What we collect from children">
          <p>
            Children may provide or generate information while learning, including their name or username, class
            participation, chess games, moves, assignments, chat, questions, coach feedback, progress data and, where
            enabled and lawful, audio/video interaction or recordings. We seek to avoid collecting information that is
            not reasonably needed for the educational, safety or operational purpose involved.
          </p>
        </LegalClause>
        <LegalClause title="5.3 US children under 13 / COPPA">
          <p>
            For a child in the United States under 13 where COPPA applies, Upstep will provide required notice and
            obtain verifiable parental consent before collecting, using or disclosing the child’s personal information,
            unless a statutory exception permits limited collection. A Parent may request to review the child’s personal
            information, have it deleted, refuse further collection or use, and exercise other COPPA rights. If we learn
            that information was collected from a child under 13 without required consent, we will take appropriate
            steps to obtain consent or delete the information.
          </p>
        </LegalClause>
        <LegalClause title="5.4 EU and UK children">
          <p>
            Where Upstep relies on consent to provide an online service directly to a child, the age at which the child
            may consent independently varies. Under the EU GDPR the default threshold is 16, although Member States may
            set a lower age not below 13. Under the UK GDPR the relevant threshold is 13. Below the applicable
            threshold, we make reasonable efforts to obtain or verify authorisation from the holder of parental
            responsibility where Article 8 applies.
          </p>
        </LegalClause>
        <LegalClause title="5.5 India">
          <p>
            India’s DPDP Act defines a child as a person under 18. Where and when the relevant DPDP provisions apply,
            Upstep will obtain verifiable parental or lawful-guardian consent before processing a child’s personal data
            where required, use appropriate verification measures, and comply with applicable restrictions on
            processing that may adversely affect a child, tracking or behavioural monitoring, and targeted advertising
            directed at children, subject to any lawful exemptions.
          </p>
        </LegalClause>
        <LegalClause title="5.6 Other jurisdictions">
          <p>
            We also apply local child-privacy requirements where relevant. This may include parental consent or
            meaningful-consent standards in Canada, age-appropriate protections under Australian privacy law, Singapore
            PDPA requirements and children-specific guidance, and additional UAE requirements for children, including
            where rules apply to children under 13.
          </p>
        </LegalClause>
        <LegalClause title="5.7 No targeted advertising to children">
          <p>
            Upstep does not use children’s personal data for targeted or behavioural advertising and does not knowingly
            sell or share children’s personal data for cross-context behavioural advertising. We do not condition
            ordinary educational access on optional consent for promotional use of a child’s photograph, image,
            testimonial or story where such consent is legally required.
          </p>
        </LegalClause>
        <LegalClause title="5.8 Parent review and deletion requests">
          <p>
            Subject to applicable law and any lawful retention requirement, a Parent may contact Upstep to ask what
            personal data we hold about their child, request correction or deletion, withdraw consent where processing
            relies on consent, or request that future collection or use stop. We may need to verify the requester’s
            identity and authority before acting.
          </p>
        </LegalClause>
      </>
    ),
  },
  {
    id: "classes-and-recordings",
    title: "6. Live Classes, Audio/Video and Recordings",
    body: (
      <>
        <LegalClause title="6.1 Class data">
          <p>
            Live online classes may involve video, audio, screen sharing, chat, digital chess boards, assignments and
            Coach feedback. Participants should avoid sharing unnecessary sensitive information during a class.
          </p>
        </LegalClause>
        <LegalClause title="6.2 Academy recordings">
          <p>
            Upstep may record some sessions where lawful and appropriately notified. Purposes may include safeguarding,
            quality assurance, Coach training, complaint or attendance resolution, service improvement, internal
            educational records and authorised playback. The categories recorded may include video, audio, screen
            sharing, chat and digital-board activity.
          </p>
        </LegalClause>
        <LegalClause title="6.3 Consent and promotional use">
          <p>
            Where applicable law requires a particular form of participant or parental consent for recording, we will
            seek it before relying on the recording for that purpose. Recording a class for educational, safety or
            operational purposes does not by itself authorise public or promotional use. Public promotional use is
            governed separately by Section 7 and applicable consent requirements.
          </p>
        </LegalClause>
        <LegalClause title="6.4 Recording retention">
          <p>
            Recordings are retained only for as long as reasonably necessary for the relevant purpose, legal
            obligation, dispute, safeguarding need or authorised playback period. Upstep may delete recordings when they
            are no longer needed and does not promise permanent archival access unless a specific Service says
            otherwise.
          </p>
        </LegalClause>
      </>
    ),
  },
  {
    id: "achievements-and-media",
    title: "7. Student Achievements, Photos, Testimonials and Media",
    body: (
      <>
        <p>
          Upstep may recognise Student achievements such as ratings, improvements, tournament results, rankings, awards,
          certificates, titles or milestones through official Upstep channels, including the Website, social media,
          WhatsApp communications, newsletters and other materials, subject to applicable law. Achievement content may
          include a Student’s name, photograph or other identifiable information.
        </p>
        <p>
          Where a use is based on consent, consent may be withdrawn prospectively as permitted by law. Withdrawal does
          not necessarily require recall of printed materials already distributed or removal from independent third
          parties outside Upstep’s reasonable control, although we will take reasonable steps concerning content under
          our control where required.
        </p>
      </>
    ),
  },
  {
    id: "chess-games-and-lms",
    title: "8. Chess Games, LMS Data and Derived Educational Content",
    body: (
      <>
        <p>
          Chess games and chess-related activity conducted, played, submitted or generated through the LMS, classes,
          practice, assignments or tournaments may be stored and analysed for delivering instruction, assessing
          progress, fair-play review, curriculum improvement, product development, analytics and other legitimate
          educational or business purposes.
        </p>
        <p>
          This data may include games, moves, positions, variations, annotations, mistakes, tactical sequences, timing
          and related learning metadata. Because a game record may be linked to a Student account, it may constitute
          personal data even though chess moves or positions themselves are not inherently identifying.
        </p>
        <p>
          Upstep may create puzzles, exercises, annotations, classifications, compilations, statistical insights,
          training datasets or other educational resources from game data as permitted by the Terms of Service and
          applicable law. Where appropriate, material used outside the Student’s individual learning environment may be
          aggregated, anonymised or de-identified.
        </p>
      </>
    ),
  },
  {
    id: "communications",
    title: "9. Communications and Marketing",
    body: (
      <>
        <LegalClause title="9.1 Service communications">
          <p>
            We may use email, SMS, WhatsApp, telephone or other channels provided or used by you to send class links,
            reminders, schedule updates, homework information, receipts, renewal notices, safety notices and
            customer-support messages. These are generally operational communications connected with the Services.
          </p>
        </LegalClause>
        <LegalClause title="9.2 Marketing">
          <p>
            We may send information about Upstep programmes, events, offers or educational content where permitted by
            law. Where consent is required, we will seek it. Marketing preferences can be changed using the available
            unsubscribe/opt-out method or by contacting Upstep. Opting out of marketing does not stop necessary service
            communications.
          </p>
        </LegalClause>
        <LegalClause title="9.3 Direct marketing to children">
          <p>
            We do not direct targeted or behavioural advertising at children. Any promotional communication involving
            or directed to a child will be handled with age-appropriate safeguards and applicable parental or other
            consent requirements.
          </p>
        </LegalClause>
      </>
    ),
  },
  {
    id: "cookies",
    title: "10. Cookies and Similar Technologies",
    body: (
      <>
        <p>
          Our Website and digital services may use cookies, pixels, local storage, SDKs and similar technologies. These
          technologies may be used for:
        </p>
        <ul>
          <li>strictly necessary functions such as security, login, session management and basic site operation;</li>
          <li>preferences and functionality, such as remembering settings;</li>
          <li>analytics and performance measurement, such as understanding how visitors use the Website; and</li>
          <li>marketing measurement or advertising technologies where legally permitted and appropriately disclosed.</li>
        </ul>
        <p>
          Where applicable law requires consent before non-essential cookies or similar technologies are used, we will
          provide an appropriate consent mechanism. Browser settings may also allow cookies to be blocked or deleted,
          although some features may then work differently. Upstep does not knowingly use tracking technologies to
          behaviourally advertise to children.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "11. When We Share Personal Data",
    body: (
      <>
        <p>
          We do not sell personal data for monetary consideration. We may disclose personal data only as reasonably
          necessary for the purposes described in this Policy, including to the following categories:
        </p>
        <LegalTable
          head={["Recipient", "Why data may be shared"]}
          rows={[
            ["Video and class platforms", "To host live classes, meetings, screen sharing, chat or recordings."],
            [
              "LMS and chess technology providers",
              "To operate digital boards, games, puzzles, assignments, analysis, accounts and learning features.",
            ],
            ["Payment providers", "To process payments, refunds, fraud checks and transaction records."],
            [
              "Cloud, hosting and security providers",
              "To host systems, store data, back up services, monitor security and maintain reliability.",
            ],
            [
              "CRM, support and communications providers",
              "To manage inquiries, enrollment, email, SMS, WhatsApp, calls, support tickets and service communications.",
            ],
            [
              "Analytics and website providers",
              "To understand Website performance, traffic, technical issues and marketing effectiveness, subject to consent/opt-out rules where applicable.",
            ],
            [
              "Coaches and authorised personnel",
              "To deliver teaching, scheduling, support, quality review, safeguarding and operational functions on a need-to-know basis.",
            ],
            [
              "Professional advisers and authorities",
              "To obtain legal/accounting advice, establish or defend claims, comply with law or respond to valid government/regulatory requests.",
            ],
            [
              "Corporate transactions",
              "If Upstep undergoes a merger, acquisition, financing, reorganisation or sale of assets, subject to applicable confidentiality and privacy requirements.",
            ],
          ]}
        />
        <p>
          Service providers are expected to process personal data only for authorised purposes and to use appropriate
          confidentiality, security and data-protection measures. Some third-party services may act as independent
          controllers and apply their own privacy notices.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "12. International Data Transfers",
    body: (
      <>
        <p>
          Upstep is based in India and serves Students internationally. Personal data may therefore be processed in
          India, the United States, the United Kingdom, the European Economic Area, Singapore, the UAE, Australia,
          Canada or other countries where Upstep or its service providers operate.
        </p>
        <p>
          Privacy laws and enforcement mechanisms differ between countries. Where applicable law requires transfer
          safeguards, Upstep will use an appropriate mechanism, which may include adequacy decisions, Standard
          Contractual Clauses, the UK International Data Transfer Agreement or Addendum, contractual protections,
          recognised certifications or another lawful transfer mechanism. We may also conduct transfer-risk assessments
          or adopt supplementary safeguards where required.
        </p>
        <p>
          For India, international transfers will be handled in accordance with applicable DPDP requirements and any
          government restrictions or conditions in force at the relevant time.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "13. Data Retention",
    body: (
      <>
        <p>
          We retain personal data only for as long as reasonably necessary for the purpose for which it was collected,
          including to provide Services, maintain academic or account history, comply with tax/accounting/legal
          obligations, resolve disputes, protect users, investigate fraud or safeguarding matters, or establish and
          defend legal claims.
        </p>
        <LegalTable
          head={["Type", "General approach"]}
          rows={[
            [
              "Account and enrollment records",
              "Kept while the relationship is active and for a reasonable period afterwards for administration, support, legal and accounting purposes.",
            ],
            [
              "Learning and LMS records",
              "Kept while useful for educational history, progress, curriculum/product improvement or legitimate operational needs, subject to applicable rights and minimisation.",
            ],
            [
              "Recordings",
              "Kept for the relevant educational, safety, training, dispute or playback purpose and deleted when no longer reasonably needed, unless law or a safeguarding/claim hold requires longer.",
            ],
            ["Payment/tax records", "Kept for statutory accounting, tax, fraud-prevention and legal periods."],
            [
              "Marketing records",
              "Kept while marketing is permitted and as needed to respect opt-outs or suppression requests.",
            ],
            [
              "Safeguarding/dispute records",
              "May be retained longer where reasonably necessary to protect children, investigate serious incidents, defend claims or comply with law.",
            ],
          ]}
        />
        <p>
          When data is no longer needed, we may delete it, anonymise it, de-identify it or securely archive it where
          continued retention is lawful. Anonymised information that no longer identifies an individual may be retained
          and used for legitimate purposes.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "14. Security",
    body: (
      <>
        <p>
          Upstep uses administrative, organisational and technical safeguards designed to protect personal data against
          unauthorised access, disclosure, alteration, loss or misuse. Depending on the system, measures may include
          access controls, role-based permissions, authentication, secure hosting, encryption where appropriate,
          logging, backups, vendor controls, staff confidentiality obligations and incident-response procedures.
        </p>
        <p>
          No online system can be guaranteed completely secure. Parents and Students should protect passwords and class
          links, use secure devices, avoid sharing unnecessary personal information and notify Upstep promptly if they
          suspect an account or privacy incident.
        </p>
        <p>
          Where a personal-data breach triggers a legal notification obligation, Upstep will notify affected
          individuals and/or the relevant authority as required by applicable law.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "15. Your Privacy Rights",
    body: (
      <>
        <p>Privacy rights vary by jurisdiction. Subject to applicable law and exceptions, you may have the right to:</p>
        <ul>
          <li>know whether and how we process your personal data and obtain access or a copy;</li>
          <li>correct inaccurate or incomplete personal data;</li>
          <li>request deletion or erasure;</li>
          <li>restrict, object to or withdraw consent for certain processing;</li>
          <li>receive data in a portable format where the law provides this right;</li>
          <li>opt out of sale, sharing, targeted advertising or certain profiling where applicable;</li>
          <li>appeal or challenge a privacy-rights decision where applicable;</li>
          <li>nominate another person to exercise specified rights where applicable under Indian law;</li>
          <li>complain through Upstep’s grievance process or to a competent privacy regulator; and</li>
          <li>not be discriminated against for exercising a statutory privacy right.</li>
        </ul>
        <p>
          We may ask for information reasonably necessary to verify identity, authority or parental status. We will not
          require more personal data than reasonably necessary for verification. Some requests may be refused or
          limited where the law permits, including where retention is required by law, necessary for legal claims,
          required for safety or another person’s rights would be affected.
        </p>
      </>
    ),
  },
  {
    id: "regional-notices",
    title: "16. Regional Privacy Notices",
    body: (
      <>
        <LegalClause title="16.1 India">
          <p>
            Where and when applicable provisions of the DPDP Act and Rules apply, individuals may have rights including
            access to information about processing, correction and erasure, grievance redressal and nomination, subject
            to the Act. For children, applicable provisions may require verifiable parental consent and restrict
            detrimental processing, tracking/behavioural monitoring and targeted advertising. Upstep will apply the
            rules and commencement schedule in force at the relevant time.
          </p>
        </LegalClause>
        <LegalClause title="16.2 European Economic Area">
          <p>
            Where the EU GDPR applies, Upstep may rely on contract, legitimate interests, consent, legal obligation,
            vital interests or another lawful basis as appropriate. Individuals may have rights of access,
            rectification, erasure, restriction, objection, portability and withdrawal of consent, and may complain to
            their local supervisory authority. Where required for international transfers, Upstep uses recognised
            safeguards such as Standard Contractual Clauses.
          </p>
        </LegalClause>
        <LegalClause title="16.3 United Kingdom">
          <p>
            Where UK data-protection law applies, similar rights are available under the UK GDPR and Data Protection Act
            2018. Article 8 applies where consent is the lawful basis for an information society service offered
            directly to a child; the UK digital-consent age is 13. Individuals may complain to the UK Information
            Commissioner where applicable.
          </p>
        </LegalClause>
        <LegalClause title="16.4 United States and California">
          <p>
            COPPA protections for children under 13 are described in Section 5.3. Where Upstep is subject to the
            CCPA/CPRA or another US state privacy law, eligible residents may have rights to know, access, correct or
            delete personal information and to opt out of sale, sharing, targeted advertising or certain profiling.
            Upstep does not sell personal data for monetary consideration and does not knowingly sell or share personal
            data of children under 16 for cross-context behavioural advertising without the affirmative authorisation
            required by law.
          </p>
        </LegalClause>
        <LegalClause title="16.5 Canada">
          <p>
            Where Canadian privacy law applies, Upstep seeks meaningful consent appropriate to the sensitivity of the
            information and the maturity of the individual. For children who cannot meaningfully consent – generally
            including children under 13 absent exceptional circumstances – parental or guardian consent is sought.
            Optional promotional use of a child’s photo or video is not treated as necessary to receive ordinary
            educational Services where the law requires separate consent.
          </p>
        </LegalClause>
        <LegalClause title="16.6 Australia">
          <p>
            Where Australian privacy law applies, Upstep follows applicable Australian Privacy Principles concerning
            notice, collection, use/disclosure, security, access/correction, direct marketing and cross-border handling.
            We also monitor and apply children-specific online privacy requirements as they become legally applicable to
            the Services.
          </p>
        </LegalClause>
        <LegalClause title="16.7 Singapore">
          <p>
            Where Singapore’s PDPA applies, Upstep follows applicable obligations relating to notification, consent,
            purpose limitation, protection, retention, access/correction, transfer limitation, breach notification and
            accountability. Children’s data is handled with the higher care contemplated by Singapore’s guidance for
            children’s personal data in the digital environment.
          </p>
        </LegalClause>
        <LegalClause title="16.8 United Arab Emirates">
          <p>
            Where UAE privacy law applies, Upstep follows applicable consent, transparency, security and
            data-subject-rights requirements. Additional child digital-safety requirements may apply, including parental
            consent and restrictions on targeted advertising or commercial use of personal data for children below
            specified ages.
          </p>
        </LegalClause>
      </>
    ),
  },
  {
    id: "automated-tools",
    title: "17. Automated Tools, Analytics and AI",
    body: (
      <>
        <p>
          Upstep may use automated tools, chess engines, analytics or AI-assisted systems to support learning, game
          analysis, content recommendations, quality review, fraud/fair-play detection, support or operational
          efficiency. These tools may generate scores, classifications, recommendations or alerts.
        </p>
        <p>
          Upstep does not intend to make solely automated decisions that produce legal or similarly significant effects
          on a Student or Parent without meaningful human involvement where applicable law restricts such
          decision-making. Fair-play or safeguarding concerns may be informed by automated indicators, but Upstep may
          also consider Coach observations, account history, game data and other relevant evidence.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "18. Changes to This Policy",
    body: (
      <p>
        We may update this Policy to reflect changes in law, technology, Services or data practices. The latest version
        will be published on the Website with an updated effective date. Where required by law, we will provide
        additional notice or obtain fresh consent before materially changing a processing activity that requires
        consent.
      </p>
    ),
  },
  {
    id: "contact",
    title: "19. Contact, Privacy Enquiries and Complaints",
    body: (
      <>
        <p>
          For privacy questions, parental requests, access/correction/deletion requests, consent withdrawal or
          complaints, contact Upstep through the official contact channels published on the Website.
        </p>
        <p>
          <strong>Website:</strong> <a href="https://www.upstepacademy.com">https://www.upstepacademy.com</a>
          <br />
          <strong>Email:</strong> <a href="mailto:info@UpstepAcademy.com">info@UpstepAcademy.com</a>
        </p>
        <p>
          Upstep will publish or maintain reasonably accessible contact details for the person responsible for
          privacy/grievance enquiries, including any Data Protection Officer or designated privacy contact where
          applicable law requires one. We may update those business contact details without treating the change as a
          substantive amendment to this Policy.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <InfoPage>
      <InfoHero
        eyebrow="Legal"
        title="Global Privacy Policy"
        lead="How Upstep collects, uses, shares, stores and protects personal data, and how individuals may exercise their privacy rights."
      />

      <LegalDoc
        sections={SECTIONS}
        intro={
          <>
            <div className="legal-callout">
              <h2 className="legal-callout__title">Important for parents and guardians</h2>
              <p>
                Upstep Academy provides online chess services to students of all ages, including children. For a Minor,
                the Parent or legal guardian is normally the primary account and contracting contact and should review
                this Policy. We apply additional safeguards to children’s personal data and seek parental or other
                legally required consent where applicable.
              </p>
              <p>
                This Policy should be read together with the Terms of Service, Course Terms and Conditions, Refund
                Policy and Cancellation Policy.
              </p>
            </div>

            <div className="legal-callout">
              <h2 className="legal-callout__title">Plain-language summary</h2>
              <p>This summary highlights the main points. The full Policy below provides the details.</p>
              <ul>
                <li>
                  We collect information needed to enroll students, deliver and improve classes, operate our LMS,
                  communicate with families, process payments, protect users and comply with law.
                </li>
                <li>
                  Student data may include name, age, chess profile, attendance, assignments, game history, LMS
                  activity, chat or class interactions and, where applicable, audio/video recordings.
                </li>
                <li>
                  Because many Students are children, we use age-appropriate safeguards and parental processes. We do
                  not use children’s personal data for targeted advertising or behavioural advertising.
                </li>
                <li>
                  Some classes may be recorded for safeguarding, quality, training, dispute resolution, service
                  improvement or authorised playback. Promotional use is handled separately and, where required, with
                  specific consent.
                </li>
                <li>
                  We use trusted service providers such as video-conferencing, cloud, payment, messaging, analytics, CRM
                  and chess/LMS providers. They may process data for Upstep under appropriate contractual and security
                  controls.
                </li>
                <li>
                  Data may be processed in India and other countries. Where required, we use contractual or other
                  recognised safeguards for international transfers.
                </li>
                <li>
                  Depending on where you live, you may have rights to access, correct, delete, restrict or object to
                  processing, withdraw consent, opt out of certain uses, complain to a regulator or exercise other
                  statutory rights.
                </li>
                <li>
                  We do not sell personal data for monetary consideration. We do not knowingly sell or share children’s
                  personal data for cross-context behavioural advertising.
                </li>
              </ul>
            </div>
          </>
        }
      />
    </InfoPage>
  );
}
