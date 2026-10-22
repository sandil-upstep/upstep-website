"use client";

import { useEffect, useState } from "react";
import Button from "../common/Button";
import { useGap } from "./GapContext";

// A floating "Register for GAP" once the hero has scrolled away. It steps
// aside while the form or the closing card (which have their own) are on
// screen. Styled in gap.scss.
export default function GapRegisterPill() {
  const { goToRegister } = useGap();
  const [past, setPast] = useState(false);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".gap-hero");
    const onScroll = () => setPast(window.scrollY > (hero?.offsetHeight ?? 600) * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
      setCovered(onScreen.size > 0);
    });
    ["register", "gap-closing"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const shown = past && !covered;
  return (
    <div className={`gap-pill${shown ? " is-shown" : ""}`} inert={!shown}>
      <Button size="sm" onClick={goToRegister}>
        <span className="gap-pill__dot" aria-hidden="true" />
        Register for GAP
      </Button>
    </div>
  );
}
