"use client";

import { useState } from "react";
import { useReveal } from "../gap/GapParts";
import { CoursesHead, CoursesLines, Cube } from "./CoursesParts";
import { FAQS } from "./coursesPageData";
import "./coursesFaqs.scss";

// FAQs: an accordion with one answer open at a time, the second open to start
// with, as in the design.
export default function CoursesFaqs() {
  const ref = useReveal<HTMLElement>();
  const [open, setOpen] = useState<number | null>(1);

  return (
    <section ref={ref} className="courses-faqs courses-section" aria-labelledby="courses-faqs-title">
      <CoursesLines />
      <div className="courses-faqs__checks" aria-hidden="true" />
      <div className="courses-inner">
        <CoursesHead eyebrow="Some text goes here" title="FAQs" id="courses-faqs-title" />
        <ul className="courses-faqs__list" data-reveal-group>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <li key={faq.q} className={`courses-faq${isOpen ? " is-open" : ""}`}>
                <h3>
                  <button
                    type="button"
                    id={`courses-faq-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`courses-faq-a${i}`}
                    className="courses-faq__q"
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {faq.q}
                    <span className="courses-faq__icon" aria-hidden="true">
                      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <path d="m2 3.5 3 3 3-3" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div
                  className="courses-faq__a"
                  id={`courses-faq-a${i}`}
                  role="region"
                  aria-labelledby={`courses-faq-q${i}`}
                  inert={!isOpen}
                >
                  <div>
                    <div className="courses-faq__inner">
                      {faq.a.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                      {faq.list && (
                        <ol>
                          {faq.list.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      )}
                      {faq.after?.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <Cube className="courses-faqs__cube courses-faqs__cube--a" depth={0.6} />
      <Cube className="courses-faqs__cube courses-faqs__cube--b" depth={0.4} />
    </section>
  );
}
