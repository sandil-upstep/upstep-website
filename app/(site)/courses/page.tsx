import type { Metadata } from "next";
import CubeParallax from "@/components/CubeParallax";
import CoursesBenefits from "@/components/courses/CoursesBenefits";
import CoursesCoaches from "@/components/courses/CoursesCoaches";
import CoursesFaqs from "@/components/courses/CoursesFaqs";
import CoursesIntro from "@/components/courses/CoursesIntro";
import CoursesPresence from "@/components/courses/CoursesPresence";
import CoursesShowcase from "@/components/courses/CoursesShowcase";
import "@/components/courses/courses.scss";

export const metadata: Metadata = {
  title: "The Chess Coaching Levels · Upstep Academy",
  description:
    "Structured online chess coaching for kids aged 4 to 15, from absolute beginners to FIDE-rated tournament players, across 6 levels.",
};

// The courses overview: every level and session format in one place. Each
// course has its own page beside it (courses/[course]).
export default function CoursesPage() {
  return (
    <main className="courses flex-1">
      <CoursesIntro />
      {/* TODO: the "Beginner to Master" intro and the pinned "1. Beginner
          Level" panel go here; left blank for now. */}
      <section className="courses-levels" id="levels" aria-hidden="true" />
      <CoursesCoaches />
      <CoursesBenefits />
      <CoursesFaqs />
      <CoursesPresence />
      <CoursesShowcase />
      <CubeParallax />
    </main>
  );
}
