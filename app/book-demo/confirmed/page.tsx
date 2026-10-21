import type { Metadata } from "next";
import DemoConfirmed from "@/components/DemoConfirmed";

export const metadata: Metadata = {
  title: "Your free demo is booked · Upstep Academy",
  robots: { index: false, follow: false },
};

// Opened in a new tab by the demo booking drawer; ?id= names the booking.
export default async function DemoConfirmedPage(props: PageProps<"/book-demo/confirmed">) {
  const { id } = await props.searchParams;
  return <DemoConfirmed id={typeof id === "string" ? id : null} />;
}
