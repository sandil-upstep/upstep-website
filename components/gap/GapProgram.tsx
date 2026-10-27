"use client";

import { useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import { GapHead, GapLines, useReveal } from "./GapParts";
import { FREE_HOURS, MODULES, TOTAL_HOURS } from "./gapData";
import "./gapProgram.scss";

// "What is GAP": the year's hours split by module, the five modules, and the
// one picked, told in full on the navy panel. The bar and the list pick the
// same module.
export default function GapProgram() {
  const [picked, setPicked] = useState(0);
  const ref = useReveal<HTMLElement>();
  const mod = MODULES[picked];
  const spotRef = useRef<HTMLSpanElement>(null);

  // The hover checkerboard follows the pointer across the panel.
  const moveSpot = (e: PointerEvent<HTMLDivElement>) => {
    const spot = spotRef.current;
    if (!spot || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    spot.style.setProperty("--mx", `${e.clientX - box.left}px`);
    spot.style.setProperty("--my", `${e.clientY - box.top}px`);
  };

  return (
    <section ref={ref} id="program" className="gap-section gap-program" aria-labelledby="gap-program-title">
      <GapLines />
      <div className="gap-inner">
        <GapHead
          eyebrow="What is GAP"
          id="gap-program-title"
          title={
            <>
              One complete
              <br />
              master-level program
            </>
          }
          lead="Upstep’s premium program for serious competitors. Elite GM training, advanced concepts, mindset coaching and parent check-ins, all in one structured year. Tap a module to explore it."
        />

        <div className="gap-hours" data-reveal>
          <p className="gap-hours__legend">
            <span>{TOTAL_HOURS} hours a year</span>
            <span>{FREE_HOURS} of them complimentary</span>
          </p>
          <div className="gap-hours__bar" role="group" aria-label="Training hours by module">
            {MODULES.map((m, i) =>
              m.hours ? (
                <button
                  key={m.title}
                  type="button"
                  className={`gap-hours__seg gap-hours__seg--${i + 1}`}
                  style={{ flexGrow: m.hours }}
                  aria-label={`${m.title}: ${m.amount}`}
                  aria-pressed={i === picked}
                  aria-controls="gap-module"
                  onClick={() => setPicked(i)}
                >
                  <span className="gap-hours__name">{m.short} · </span>
                  {m.amount}
                </button>
              ) : null
            )}
          </div>
        </div>

        <div className="gap-program__body">
          <ul className="gap-modules" data-reveal-group>
            {MODULES.map((m, i) => (
              <li key={m.title}>
                <button
                  type="button"
                  className="gap-modules__btn"
                  aria-pressed={i === picked}
                  aria-controls="gap-module"
                  onClick={() => setPicked(i)}
                >
                  <span className="gap-modules__num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="gap-modules__title">{m.title}</span>
                  <span className="gap-modules__amount">{m.amount}</span>
                </button>
              </li>
            ))}
          </ul>

          <div id="gap-module" className="gap-module" aria-live="polite" data-reveal onPointerMove={moveSpot}>
            <span className="gap-module__checker" aria-hidden="true" />
            <span ref={spotRef} className="gap-module__spot" aria-hidden="true" />
            <Image
              key={mod.icon.src}
              src={mod.icon.src}
              width={mod.icon.width}
              height={mod.icon.height}
              alt=""
              sizes="128px"
              className="gap-module__icon"
            />
            <div className="gap-module__content" key={picked}>
              <p className="gap-module__meta">
                <span className="gap-module__num">{String(picked + 1).padStart(2, "0")}</span>
                <span className="gap-module__tag">{mod.tag}</span>
              </p>
              <h3 className="gap-module__title">{mod.title}</h3>
              <p className="gap-module__body">{mod.body}</p>
              <p className="gap-module__big">
                <span className="gap-module__big-num">{mod.big}</span>
                <span>{mod.unit}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
