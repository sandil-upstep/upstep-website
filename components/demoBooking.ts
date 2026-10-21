// Opens the demo booking drawer (DemoBookingDrawer.tsx, mounted once in the
// layout) from any "Book a FREE demo" button.
const listeners = new Set<() => void>();

export function openDemoBooking() {
  listeners.forEach((open) => open());
}

export function onOpenDemoBooking(open: () => void) {
  listeners.add(open);
  return () => {
    listeners.delete(open);
  };
}
