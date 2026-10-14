import Image from "next/image";
import RollingText, { type RollingTextItem } from "./RollingText";
import "./darkSection.scss";

// GM Anand's World Championship titles, listed under the crown.
const CHAMPIONSHIP_YEARS = ["2000", "2007", "2008", "2010", "2012"];

// Placeholder asset paths — drop the real files into public/images.
const CERTIFICATE_SRC = "/images/certificate.png";
const PORTRAIT_SRC = "/images/anand-video-thumb.png";
const CROWN_SRC = "/images/crown.svg";

// Messages rolling through the slate card. Only the first has real copy so
// far — the others are placeholders until their content is ready.
const CERTIFIED_MESSAGES: RollingTextItem[] = [
  {
    title: "Certified by\nGM Viswanathan Anand",
    description:
      "Earn Level completion certificate Signed & inspired by the 5-time World Chess Champion.",
  },
  {
    title: "Placeholder title\nsecond message",
    description: "Placeholder copy for the second rolling message.",
  },
  {
    title: "Placeholder title\nthird message",
    description: "Placeholder copy for the third rolling message.",
  },
];

type SlideCard = {
  id: string;
  title: string;
  description: string;
  image: { src: string; width: number; height: number; alt: string };
};

// Only the first card has real copy so far — the rest repeat it to fill the
// row until their content is ready. Image path is a placeholder too.
const FAMILY_IMAGE = {
  src: "/images/anand-cards-img.png",
  width: 818,
  height: 680,
  alt: "A family giving a thumbs up",
};
const SLIDE_CARDS: SlideCard[] = ["quality", "card-2", "card-3", "card-4", "card-5", "card-6"].map((id) => ({
  id,
  title: "High quality online chess classes and results.",
  description:
    "Shaping young minds through chess, loved by students and trusted by parents.",
  image: FAMILY_IMAGE,
}));

export default function DarkSection() {
  return (
    <section className="bg-[#071025] text-[#ffffff]  relative">
      <img src="/images/checked-bg.png" alt="" className="absolute top-0 w-1/2 object-cover object-top right-0" aria-hidden="true" />
      <div className="mx-auto w-full max-w-6xl px-6 pt-24 sm:px-10 sm:pt-24 -mb-12">
        <p className="text-lg font-medium text-white">
          The UpStep Difference
        </p>
        
        <Image
          src="/images/why-txt.svg"
          width={600}
          height={400}
          alt="Section illustration"
          className="mt-8 why-txt-img"
          /> 

        {/* Certified by GM Anand — the design's 1232x502 frame, with every
            piece positioned as a percentage of it on large screens. */}
        <div className="relative mt-0 flex flex-col gap-8 lg:block lg:aspect-1232/502">
          {/* Slate card */}
          <div className="certified-card relative rounded-[28px] px-8 py-10 lg:absolute lg:top-[22%] lg:bottom-[15%] lg:left-[12.7%] lg:right-[33%] lg:flex lg:flex-col lg:justify-center lg:py-0 lg:pr-[14%] lg:pl-[9.5%]">
            <RollingText items={CERTIFIED_MESSAGES} />
          </div>

          {/* Certificate, overlapping the card's left edge */}
          <div className="relative w-full max-w-65 lg:absolute lg:top-[33%] lg:left-0 lg:w-[16.6%] lg:max-w-none">
            <Image
              src={CERTIFICATE_SRC}
              width={410}
              height={288}
              alt="Upstep Academy level completion certificate signed by GM Viswanathan Anand"
              className="h-auto w-full rounded-sm shadow-2xl"
            />
          </div>

          {/* Portrait, breaking out above the card */}
          <div className="relative overflow-hidden rounded-b-[28px] lg:absolute lg:top-0 lg:bottom-0 lg:left-[50.3%] lg:right-0 max-w-md">
            <Image
              src={PORTRAIT_SRC}
              width={1224}
              height={1004}
              alt="GM Viswanathan Anand"
              className="h-full w-full object-cover object-top"
            />
          </div>

          {/* Play button, straddling the card and the portrait */}
          <button
            type="button"
            aria-label="Play video"
            className="absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/5 text-white backdrop-blur-sm transition-transform hover:scale-105 lg:top-[65%] lg:left-[58.6%]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" className="ml-1 h-9 w-9">
              <path d="M7 4.5v15L19 12 7 4.5Z" />
            </svg>
          </button>

          {/* Crown + championship years */}
          <div className="flex flex-col md:flex-row items-center gap-4 lg:absolute lg:top-[12%] lg:right-0 lg:flex-col lg:items-end lg:gap-0">
            
            <ul className="flex gap-3 flex-col lg:gap-0" aria-label="World Championship years">
              <li>
                <Image
                  src={CROWN_SRC}
                  width={48}
                  height={36}
                  alt=""
                  aria-hidden="true"
                  className="mb-2 h-auto w-10 lg:mr-[14%] lg:w-12"
                />
            </li>  
              {CHAMPIONSHIP_YEARS.map((year) => (
                <li
                  key={year}
                  className="champion-year text-3xl leading-[1.2] font-extrabold tracking-wider lg:text-[44px]"
                >
                  {year}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full py-10 sm:py-6 pl-0 xl:pl-56">
        {/* Horizontally scrolling card row. Top padding leaves room for each
            photo to break out above its card — an overflow-x scroller clips
            vertically too — plus the edge fade. Side padding/scroll-padding
            keep the first and last cards clear of the side fades. */}
        <div className="sliding-window flex snap-x snap-mandatory scroll-px-[6%] gap-10 overflow-x-auto pt-20 pb-12">
          {SLIDE_CARDS.map((card) => (
            <article
              key={card.id}
              className="certified-card relative flex aspect-409/545 w-75 shrink-0 snap-start flex-col justify-end rounded-[28px] px-6 pb-10 text-center sm:w-[350px]"
            >
              <Image
                src={card.image.src}
                width={card.image.width}
                height={card.image.height}
                alt={card.image.alt}
                className="slide-card-photo pointer-events-none absolute -top-10 left-0 h-auto w-full"
              />
              <h3 className="relative text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
                {card.title}
              </h3>
              <p className="relative mt-5 text-base text-white">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>

    </section>
  );
}
