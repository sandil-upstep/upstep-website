"use client";

import Button from "../common/Button";
import { openDemoBooking } from "../demoBooking";

// Opens the demo booking drawer from a server-rendered page.
export default function BookDemoButton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <Button size={size} onClick={openDemoBooking}>
      Book a FREE demo class
    </Button>
  );
}
