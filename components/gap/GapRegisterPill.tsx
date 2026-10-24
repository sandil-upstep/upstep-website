"use client";

import { useEffect, useState } from "react";
import Button from "../common/Button";
import { useGap } from "./GapContext";

// A floating "Register for GAP" once the hero has scrolled away; it opens the
// registration drawer. It steps aside while the closing card (which has its
// own) is on screen. Styled in gap.scss.
export default function GapRegisterPill() {
  const { openRegister } = useGap();
  const [past, setPast] = useState(false);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".gap-px-hero, .gap-hero");
    const onScroll = () => setPast(window.scrollY > (hero?.offsetHeight ?? 600) * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(([e]) => setCovered(e.isIntersecting));
    const closing = document.getElementById("gap-closing");
    if (closing) observer.observe(closing);

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const shown = past && !covered;
  return (
    <div className={`gap-pill${shown ? " is-shown" : ""}`} inert={!shown}>
      <Button size="sm" onClick={openRegister}>
        <span className="gap-pill__dot" aria-hidden="true" />
        Register for GAP
      </Button>
    </div>
  );
}
