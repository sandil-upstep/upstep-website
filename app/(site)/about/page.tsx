import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRIES, OFFICES } from "@/components/Footer";
import { DemoCta, InfoCards, InfoHero, InfoPage, InfoSection } from "@/components/info/InfoPage";
import BookDemoButton from "@/components/info/BookDemoButton";

export const metadata: Metadata = {
  title: "About Us · Upstep Academy",
  description:
    "Upstep Academy has taught chess online since 2020, with a structured curriculum and level certificates signed by GM Viswanathan Anand.",
};

// Built from copy already on the site (footer, home page sections).
// TODO: swap in the team's own story, founders and milestones when written.
export default function AboutPage() {
  return (
    <InfoPage>
      <InfoHero
        eyebrow="About Upstep Academy"
        title="Shaping young minds through chess"
        lead="A global leader in online chess training since 2020, known for a personalised, innovative approach to teaching: loved by students and trusted by parents."
      >
        <BookDemoButton />
      </InfoHero>

      <InfoSection eyebrow="How we teach" title="High quality online chess classes and results">
        <InfoCards
          items={[
            {
              title: "Structured Chess Curriculum",
              body: (
                <p>
                  A scientifically designed chess training curriculum developed through years of expertise for steady
                  learning and success, in six levels from <Link href="/courses/beginner">Beginner</Link> to{" "}
                  <Link href="/courses/advanced">Master &amp; Pro Master</Link>.
                </p>
              ),
            },
            {
              title: "Certified by GM Viswanathan Anand",
              body: <p>Earn a level completion certificate signed &amp; inspired by the 5-time World Chess Champion.</p>,
            },
            {
              title: "Live classes with a coach",
              body: (
                <p>
                  Every class is live and online with an Upstep coach, who tracks each student’s strengths and areas to
                  improve along a personalised learning journey.
                </p>
              ),
            },
            {
              title: "A path to competition",
              body: (
                <p>
                  Competitive players rated 1400–1800 can join the <Link href="/gap">Grandmaster Accelerator Program</Link>, a
                  year of live, GM-led training.
                </p>
              ),
            },
          ]}
        />
      </InfoSection>

      <InfoSection eyebrow="Where we are" title={`Students in ${COUNTRIES.length} countries`}>
        <p>{COUNTRIES.join(" · ")}</p>
        <InfoCards
          items={OFFICES.map((o) => ({
            tag: o.country,
            title: o.country === "India" ? "Mumbai office" : "New York office",
            body: (
              <>
                <p>{o.address}</p>
                <p>
                  <a href={`tel:${o.tel}`}>{o.phone}</a>
                </p>
              </>
            ),
          }))}
        />
      </InfoSection>

      <DemoCta />
    </InfoPage>
  );
}
