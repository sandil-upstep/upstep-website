"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

// 3D hover card (after Inspira UI's / Aceternity's "3D Card"): the edge under
// the cursor dips away, 1deg per 25px off the card's centre, while children
// styled with translateZ (see .tilt-card in anandSection.scss) lift off it.
// Uses `transform`, so anything moving the card itself must use `translate`.
// Matches the media query gating the lift styles.
const TILT_QUERY = "(hover: hover) and (prefers-reduced-motion: no-preference)";

export default function TiltCard({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const card = ref.current;
    if (!card || !window.matchMedia(TILT_QUERY).matches) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    card.style.transform = `perspective(1000px) rotateY(${x.toFixed(2)}deg) rotateX(${(-y).toFixed(2)}deg)`;
  };

  const onMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <article
      ref={ref}
      className={`tilt-card ${className ?? ""}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </article>
  );
}
