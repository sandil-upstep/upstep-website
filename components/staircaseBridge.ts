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
  // axis, at `opacity`. null hides it. Returns false if it can't be drawn.
  fallKing: (pose: { cx: number; bottom: number; h: number; spin: number; opacity: number } | null) => boolean;
};

export const staircase: { current: StaircaseHandle | null } = { current: null };
