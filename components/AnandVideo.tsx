"use client";

import { useEffect, useRef, useState } from "react";
import { lockPage, unlockPage } from "./pageLock";
import YouTubeFrame from "./YouTubeFrame";
import "./anandVideo.scss";

const embed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

// The certificate card's play button and the video it opens: a modal over the
// dimmed page, playing as it opens. The player is only mounted while it's
// open, so closing it (the ✕, Escape, or a click beside the video) stops it.
export default function AnandVideo({ videoId, title }: { videoId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const button = buttonRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    lockPage();
    return () => {
      dialog.close();
      button?.focus({ preventScroll: true });
      unlockPage();
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        className="anand__play"
        type="button"
        aria-label="Watch video"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M1.5 1.8v16.4L16.5 10 1.5 1.8z" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="anand-video"
        aria-label={title}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        {open && (
          <div className="anand-video__frame">
            <YouTubeFrame src={embed(videoId)} title={title} />
          </div>
        )}
        <button className="anand-video__close" type="button" aria-label="Close video" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </dialog>
    </>
  );
}
