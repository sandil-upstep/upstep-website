"use client";

import { useState } from "react";
import "./youTubeFrame.scss";

// A playing YouTube embed that doesn't trap the page's scroll. Wheel events
// over a cross-origin iframe never reach the page, so Lenis can't scroll it
// while the pointer rests on the video. A see-through shield sits over the
// player until it's clicked, which hands the player its controls; the shield
// comes back once the pointer leaves. Mouse only: touch scrolling already
// passes through iframes, and keyboard focus reaches the player either way.
export default function YouTubeFrame({ src, title }: { src: string; title: string }) {
  const [engaged, setEngaged] = useState(false);

  return (
    <>
      <iframe
        src={src}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        onPointerLeave={() => setEngaged(false)}
      />
      {!engaged && <span className="yt-frame__shield" aria-hidden="true" onClick={() => setEngaged(true)} />}
    </>
  );
}
