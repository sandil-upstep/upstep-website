"use client";

import Image from "next/image";
import { openDemoBooking } from "../demoBooking";
import { Arrow, Cta } from "../DemoBookingParts";
import { useGap } from "./GapContext";
import { GapHead, GapLines, useReveal } from "./GapParts";
import "./gapClosing.scss";

// The last word: a navy card with both ways in, registering or a free demo.
export default function GapClosing() {
  const { openRegister } = useGap();
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id="gap-closing" className="gap-section gap-closing" aria-labelledby="gap-closing-title">
      <GapLines />
      <div className="gap-inner">
        <div className="gap-closing__card" data-nav-theme="dark" data-reveal>
          <span className="gap-closing__checker" aria-hidden="true" />
          <span className="gap-closing__sun" aria-hidden="true" />
          <Image
            src="/images/cubes/cube-4.png"
            width={200}
            height={200}
            alt=""
            aria-hidden="true"
            className="gap-closing__cube"
            data-cube="0.7"
          />
          <GapHead
            dark
            eyebrow="From player to contender"
            id="gap-closing-title"
            title={
              <>
                Every champion has a gap.
                <br />
                We help fill it.
              </>
            }
            lead="Train like a Grandmaster. Think like one too."
          />
          <div className="gap-closing__ctas">
            <Cta onClick={openRegister}>
              Register now <Arrow />
            </Cta>
            <button type="button" className="gap-ghost gap-ghost--dark" onClick={openDemoBooking}>
              Book a free demo first
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
