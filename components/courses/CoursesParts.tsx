import type { ReactNode } from "react";
import Eyebrow from "../Eyebrow";
import RevealTitle from "../RevealTitle";

// Pieces the courses page's sections share. Styled in courses.scss.

// The home page's four guide lines, either side of the content column.
export function CoursesLines({ dark }: { dark?: boolean }) {
  return (
    <div className={`courses-lines${dark ? " courses-lines--dark" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

// Eyebrow and outlined headline, both animating in as on the home page.
export function CoursesHead({ eyebrow, title, id, dark }: { eyebrow: string; title: ReactNode; id: string; dark?: boolean }) {
  return (
    <div className={`courses-head${dark ? " courses-head--dark" : ""}`}>
      <Eyebrow className="courses-eyebrow" boxClassName="courses-eyebrow__box" rotate={45}>
        {eyebrow}
      </Eyebrow>
      <RevealTitle className="courses-title" id={id}>
        {title}
      </RevealTitle>
    </div>
  );
}

// The decorative blue cube, drifting with CubeParallax at `depth`.
export function Cube({ className, depth = 0.5, n = 4 }: { className: string; depth?: number; n?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/images/cubes/cube-${n}.png`} alt="" aria-hidden="true" className={`courses-cube ${className}`} data-cube={depth} />
  );
}

export function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}
