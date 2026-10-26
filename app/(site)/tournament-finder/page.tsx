import type { Metadata } from "next";
import Link from "next/link";
import { DemoCta, InfoCards, InfoHero, InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Tournament Finder · Upstep Academy",
  description: "Find chess tournaments for your child's level. Coming soon from Upstep Academy.",
};

// TODO: placeholder until the finder itself (data source, filters) is built.
export default function TournamentFinderPage() {
  return (
    <InfoPage>
      <InfoHero
        eyebrow="Tournament Finder"
        title="Find the right tournament for your child"
        lead="We’re building a finder for chess tournaments that suit your child’s level. It’s coming soon."
      />

      <InfoSection eyebrow="In the meantime" title="Getting ready to compete">
        <InfoCards
          items={[
            {
              title: "Rated play",
              body: (
                <p>
                  From the <Link href="/courses/intermediate">Intermediate</Link> course on, students prepare to compete in
                  rated tournaments with confidence.
                </p>
              ),
            },
            {
              title: "Grandmaster Accelerator Program",
              body: (
                <p>
                  For competitive players rated 1400–1800: a year of live, GM-led training. <Link href="/gap">See GAP</Link>
                </p>
              ),
            },
          ]}
        />
      </InfoSection>

      <DemoCta />
    </InfoPage>
  );
}
