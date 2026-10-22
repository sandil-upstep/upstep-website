"use client";

import { useState } from "react";
import Image from "next/image";
import { GapHead, GapLines, useReveal } from "./GapParts";
import { VIDEOS, ytEmbed, ytThumb } from "./gapData";
import "./gapPreview.scss";

// "Inside a session": a GM class on the player, with the playlist beside it.
// The still shows until it's played, as in What We Offer; picking another
// title stops the one playing.
export default function GapPreview() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ref = useReveal<HTMLElement>();
  const video = VIDEOS[active];

  return (
    <section ref={ref} id="preview" className="gap-section gap-preview" aria-labelledby="gap-preview-title">
      <GapLines />
      <div className="gap-inner">
        <GapHead
          eyebrow="Inside a session"
          id="gap-preview-title"
          title={
            <>
              See how
              <br />
              Grandmasters teach
            </>
          }
        />

        <div className="gap-preview__body" data-reveal>
          <div className="gap-preview__player">
            {playing ? (
              <iframe
                src={ytEmbed(video.videoId)}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="gap-preview__poster"
                aria-label={`Play video: ${video.title}`}
                onClick={() => setPlaying(true)}
              >
                <Image src={ytThumb(video.videoId)} alt="" fill sizes="(max-width: 1199px) 92vw, 46vw" />
                <span className="gap-preview__play" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className="gap-preview__caption" key={active}>
                  {video.title}
                </span>
              </button>
            )}
          </div>

          <div className="gap-preview__list">
            <p className="gap-kicker" id="gap-playlist">
              Playlist · {VIDEOS.length} videos
            </p>
            <ol aria-labelledby="gap-playlist" data-lenis-prevent>
              {VIDEOS.map((v, i) => (
                <li key={v.title}>
                  <button
                    type="button"
                    className="gap-preview__item"
                    aria-pressed={i === active}
                    onClick={() => {
                      setActive(i);
                      setPlaying(false);
                    }}
                  >
                    <span className="gap-preview__num" aria-hidden="true">
                      {i + 1}
                    </span>
                    {v.title}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
