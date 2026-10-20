// Hand-off between ScientificallyStructuredSection (the 3D staircase) and
// WhyChessSection: once the king reaches the top step, the next section
// swaps it for a 2D copy at the same screen spot and drops it into place.
export type StaircaseHandle = {
  // The staircase is ready and scroll-driven (desktop, pinned).
  active: () => boolean;
  // Page y where the staircase pin ends.
  pinEnd: () => number;
  // The king's screen spot: centre x and base y in viewport px, and its height.
  kingRect: () => { cx: number; bottom: number; h: number } | null;
  // Hide the 3D king (and its props) while the 2D copy has it.
  setKingHidden: (on: boolean) => void;
  // Draw the 3D king mid-fall, on its own canvas over the page: base at
  // (cx, bottom) in viewport px, h px tall, turned `spin` radians on its own
  // axis, at `opacity`, with the halo `ring` round it (none if left out).
  // null hides it. Returns false if it can't be drawn.
  fallKing: (
    pose: { cx: number; bottom: number; h: number; spin: number; opacity: number; ring?: KingRing | null } | null
  ) => boolean;
};

// The 3D halo ring round the king: its centre y above the king's base and its
// radius, both as shares of the king's on-screen height; its gold arcs turned
// `turn` radians (+ = anticlockwise on screen); and its opacity.
export type KingRing = { y: number; r: number; turn: number; opacity: number };

export const staircase: { current: StaircaseHandle | null } = { current: null };
