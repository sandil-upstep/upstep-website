import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSES, LEVELS, courseBySlug } from "@/components/courses/courseData";
import { DemoCta, InfoCards, InfoHero, InfoPage, InfoSection } from "@/components/info/InfoPage";
import BookDemoButton from "@/components/info/BookDemoButton";

// One page per course in the header's Courses menu; any other slug 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return COURSES.map((c) => ({ course: c.slug }));
}

export async function generateMetadata(props: PageProps<"/courses/[course]">): Promise<Metadata> {
  const course = courseBySlug((await props.params).course);
  if (!course) return {};
  return { title: `${course.name} Chess Course · Upstep Academy`, description: course.lead };
}

export default async function CoursePage(props: PageProps<"/courses/[course]">) {
  const course = courseBySlug((await props.params).course);
  if (!course) notFound();
  const others = COURSES.filter((c) => c !== course);

  return (
    <InfoPage>
      <InfoHero eyebrow="Courses" title={`${course.name} chess course`} lead={course.lead}>
        <BookDemoButton />
      </InfoHero>

      <InfoSection eyebrow="What your child learns" title="Levels in this course">
        <InfoCards
          items={course.levels.map((i) => ({
            tag: `Level ${i + 1} of ${LEVELS.length}`,
            title: LEVELS[i].name,
            body: <p>{LEVELS[i].desc}</p>,
          }))}
        />
      </InfoSection>

      <InfoSection eyebrow="Not sure where to start?" title="We’ll find the right level together">
        <p>
          In the free demo class, the coach assesses your child’s current chess level and learning needs, and you get a
          personalised roadmap with their assessed starting level. Every level ends with a completion certificate signed
          by GM Viswanathan Anand.
        </p>
        <p>
          Also see the{" "}
          {others.map((c, i) => (
            <span key={c.slug}>
              {i > 0 && " and "}
              <Link href={`/courses/${c.slug}`}>{c.name}</Link>
            </span>
          ))}{" "}
          courses.
        </p>
      </InfoSection>

      <DemoCta />
    </InfoPage>
  );
}
