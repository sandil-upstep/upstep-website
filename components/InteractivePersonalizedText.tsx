import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

// Live text instead of the old Figma glyph outlines, so the word list can be
// edited freely. Keep these in the spirit of "Interactive" / "Personalized".
const WORDS = [
  "Interactive",
  "Personalized",
  "Engaging",
  "Adaptive",
  "Expert-Led",
  "One-on-One",
  "Hands-On",
  "Structured",
  "Goal-Driven",
  "Rewarding",
];

function WordRun({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {WORDS.map((word) => (
        <li key={word} className="flex items-center">
          <span className="px-8 sm:px-12">{word}</span>
          <span aria-hidden="true" className="text-[0.4em]">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function InteractivePersonalizedText({ className = "" }: { className?: string }) {
  return (
    <div
      role="marquee"
      aria-label={WORDS.join(", ")}
      className={`interactive-marquee group overflow-hidden ${openSans.className} ${className}`}
    >
      {/* Two identical runs side by side; sliding by -50% loops seamlessly. */}
      <div className="flex w-max animate-marquee whitespace-nowrap text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-none tracking-tight group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        <WordRun />
        <WordRun hidden />
      </div>
    </div>
  );
}
