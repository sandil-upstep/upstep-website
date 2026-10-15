"use client";

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Tablet and below: the desktop <br>s are dropped so short titles sit on one
// line and long ones only wrap where the column runs out.
const COMPACT_QUERY = "(max-width: 1023.98px)";

// SplitText forces a line at every <br>, even display:none ones, so they have
// to be removed from the markup rather than hidden with CSS. Each becomes a
// space unless whitespace already precedes it.
function withoutBreaks(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.type === "br") {
      const prev = out[out.length - 1];
      if (!(typeof prev === "string" && /\s$/.test(prev))) out.push(" ");
    } else {
      out.push(child);
    }
  });
  return out;
}

// Outlined section headline that rises line by line out of clipping masks
// once it scrolls into view, just after its Eyebrow, and sinks back down when
// scrolled back above it. Like the hero title, it
// is server-rendered hidden so the unsplit text never flashes; autoSplit
// re-splits on resize/font load and hands progress over to the fresh lines.
export default function RevealTitle({
  className,
  id,
  children,
}: {
  className: string;
  id?: string;
  children: ReactNode;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  // null until the media query has been read on the client, so the title is
  // only split once, with the right line breaks.
  const [compact, setCompact] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(COMPACT_QUERY);
    const update = () => setCompact(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const title = titleRef.current;
    if (!title || compact === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(title, { autoAlpha: 1 });
      return;
    }
    const split = SplitText.create(title, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) => {
        // Line-height is tighter than the glyphs, and the outline stroke and
        // last glyph's overhang spill past the line box; pad the masks on
        // every side (pulled back by the same amount) so nothing is clipped.
        gsap.set(self.masks, {
          paddingBlock: "0.15em",
          marginBlock: "-0.15em",
          paddingInline: "0.1em",
          marginInline: "-0.1em",
        });
        gsap.set(title, { autoAlpha: 1 });
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1,
          ease: "power4.out",
          stagger: 0.12,
          delay: 0.35,
          // Rise in when scrolling down past the start, sink back into the
          // masks when scrolling up past it again.
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      },
    });
    return () => split.revert();
  }, [compact]);

  // Keyed so React swaps in a fresh <h2> rather than reconciling children
  // that SplitText has already rewritten.
  return (
    <h2
      key={compact ? "compact" : "wide"}
      ref={titleRef}
      className={className}
      id={id}
      style={{ visibility: "hidden" }}
    >
      &nbsp;{compact ? withoutBreaks(children) : children}&nbsp;
    </h2>
  );
}
