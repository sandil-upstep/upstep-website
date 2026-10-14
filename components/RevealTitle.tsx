"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

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

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(title, { autoAlpha: 1 });
      return;
    }
    const split = SplitText.create(title, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) => {
        // Line-height is tighter than the glyphs; pad the masks so the
        // stroke's ascenders and descenders aren't clipped.
        gsap.set(self.masks, { paddingBlock: "0.15em", marginBlock: "-0.15em" });
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
  }, []);

  return (
    <h2 ref={titleRef} className={className} id={id} style={{ visibility: "hidden" }}>
      {children}
    </h2>
  );
}
