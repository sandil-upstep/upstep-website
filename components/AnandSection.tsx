import Image from "next/image";
import { Open_Sans } from "next/font/google";
import AnandSliderPin from "./AnandSliderPin";
import AnandVideo from "./AnandVideo";
import AnandYears from "./AnandYears";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
import RollingText, { type RollingTextItem } from "./RollingText";
import "./anandSection.scss";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: "800",
});

// GM Anand's World Championship titles, listed under the crown (newest first).
const CHAMPIONSHIP_YEARS = ["2012", "2010", "2008", "2007", "2000"];

// Placeholder asset paths — drop the real files into public/images.
const CERTIFICATE_SRC = "/images/certificate.png";
const PORTRAIT_SRC = "/images/anand-video-thumb.png";
const CROWN_SRC = "/images/crown.svg";
// TODO: a placeholder (the GAP preview video) until GM Anand's own is published.
const ANAND_VIDEO_ID = "XHOmBV4js_E";
// depth: how far each drifts with the scroll (see CubeParallax).
const CUBES = [
  { src: "/images/cubes/cube-1.png", depth: 0.4 },
  { src: "/images/cubes/cube-16.png", depth: 0.75 },
  { src: "/images/cubes/cube-3.png", depth: 0.55 },
  { src: "/images/cubes/cube-11.png", depth: 0.9 },
];

// Messages rolling through the certificate card. Only the first has real copy
// so far — the others are placeholders until their content is ready.
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

const FAMILY_IMAGE = {
  src: "/images/anand-cards-img.png",
  width: 818,
  height: 680,
  alt: "A family giving a thumbs up",
};
// The student photo isn't in the repo yet, so its card borrows the family one.
const STUDENT_IMAGE = { ...FAMILY_IMAGE, alt: "A girl learning chess on a laptop" };

const QUALITY_CARD = {
  title: "High quality online chess classes and results.",
  description: "Shaping young minds through chess, loved by students and trusted by parents.",
  image: FAMILY_IMAGE,
};
const CURRICULUM_CARD = {
  title: "Structured Chess Curriculum",
  description:
    "A scientifically designed chess training curriculum developed through years of expertise for steady learning and success.",
  image: STUDENT_IMAGE,
};
const SLIDE_CARDS: SlideCard[] = [
  { id: "quality", ...QUALITY_CARD },
  { id: "curriculum", ...CURRICULUM_CARD },
  { id: "quality-2", ...QUALITY_CARD },
  { id: "curriculum-2", ...CURRICULUM_CARD },
];

export default function AnandSection() {
  return (
    <AnandSliderPin>
    <section className={`anand ${openSans.variable}`} aria-labelledby="anand-title">
      {/* Decorative background: guide lines, checkerboard, floating cubes */}
      <div className="anand__deco" aria-hidden="true">
        <span className="anand__line" />
        <span className="anand__line" />
        <span className="anand__line" />
        <span className="anand__line" />
        <div className="anand__checker" />
        {CUBES.map(({ src, depth }, i) => (
          <Image key={src} src={src} width={200} height={200} alt="" className={`anand__cube anand__cube--${i + 1}`} data-cube={depth} />
        ))}
      </div>

      <div className="anand__inner">
        <Eyebrow className="anand__eyebrow" boxClassName="anand__eyebrow-box">
          The UpStep Difference
        </Eyebrow>
        <RevealTitle className="anand__title" id="anand-title">
          Why we
          <br />
          are #1
        </RevealTitle>

        {/* Certificate + GM Anand */}
        <div className="anand__feature">
          <div className="anand__card">
            <Image
              src={CERTIFICATE_SRC}
              width={410}
              height={288}
              alt="UpStep Academy level completion certificate signed by Viswanathan Anand"
              className="anand__cert"
            />
            <div className="anand__card-copy">
              <RollingText
                items={CERTIFIED_MESSAGES}
                titleClassName="anand__card-title"
                descriptionClassName="anand__card-text"
              />
            </div>
            <AnandVideo videoId={ANAND_VIDEO_ID} title="GM Viswanathan Anand on UpStep Academy" />
          </div>

          <div className="anand__champ">
            <Image src={PORTRAIT_SRC} width={1224} height={1004} alt="Grandmaster Viswanathan Anand" />
          </div>

          <AnandYears years={CHAMPIONSHIP_YEARS} crownSrc={CROWN_SRC} />
        </div>

        {/* Cards slider */}
        <div className="anand__slider">
          {SLIDE_CARDS.map((card) => (
            <article key={card.id} className="anand__item">
              <div className="anand__item-img">
                <Image
                  src={card.image.src}
                  width={card.image.width}
                  height={card.image.height}
                  alt={card.image.alt}
                />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
        <div className="anand__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
    </AnandSliderPin>
  );
}
