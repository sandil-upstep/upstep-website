"use client";

import { useEffect, useState } from "react";

export type RollingTextItem = {
  title: string;
  description: string;
};

type RollingTextProps = {
  items: RollingTextItem[];
  interval?: number;
  // Override the default heading/copy styling when the block sits in a
  // tighter layout.
  titleClassName?: string;
  descriptionClassName?: string;
};

const DEFAULT_TITLE_CLASS = "text-3xl leading-tight font-semibold tracking-tight sm:text-3xl";
const DEFAULT_DESCRIPTION_CLASS = "mt-6 max-w-sm text-lg leading-7 text-white/85";

// Cycles through heading + copy pairs, rolling each one up and out as the
// next rolls in from below. Every item shares one grid cell, so the block is
// always as tall as its longest item and the layout never jumps.
export default function RollingText({
  items,
  interval = 4000,
  titleClassName = DEFAULT_TITLE_CLASS,
  descriptionClassName = DEFAULT_DESCRIPTION_CLASS,
}: RollingTextProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % items.length),
      interval,
    );
    return () => window.clearInterval(id);
  }, [items.length, interval, paused]);

  const previous = (active - 1 + items.length) % items.length;

  return (
    <div
      className="grid overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((item, i) => {
        // Waiting items jump back below without animating, so they never
        // sweep across the visible area on their way there.
        const state =
          i === active
            ? "translate-y-0 opacity-100"
            : i === previous
              ? "-translate-y-full opacity-0"
              : "translate-y-full opacity-0 transition-none";

        return (
          <div
            key={item.title + i}
            aria-hidden={i !== active}
            className={`[grid-area:1/1] self-center transition-[translate,opacity] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${state}`}
          >
            <h2 className={`whitespace-pre-line ${titleClassName}`}>{item.title}</h2>
            <p className={descriptionClassName}>{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
