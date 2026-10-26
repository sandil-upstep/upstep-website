import type { ReactNode } from "react";
import BookDemoButton from "./BookDemoButton";
import "./infoPage.scss";

// The plain content pages (About, the courses, Tournament Finder): a light
// hero under the floating header, stacked sections on the home page's column
// and guide lines, and a closing demo call to action. The footer comes from
// the site layout.

export function InfoPage({ children }: { children: ReactNode }) {
  return (
    <main className="info-page flex-1" data-nav-theme="light">
      <div className="info-page__lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      {children}
    </main>
  );
}

export function InfoHero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children?: ReactNode }) {
  return (
    <header className="info-hero">
      <p className="info-eyebrow">{eyebrow}</p>
      <h1 className="info-hero__title">{title}</h1>
      <p className="info-hero__lead">{lead}</p>
      {children && <div className="info-hero__actions">{children}</div>}
    </header>
  );
}

export function InfoSection({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section className="info-section">
      {eyebrow && <p className="info-eyebrow">{eyebrow}</p>}
      <h2 className="info-section__title">{title}</h2>
      {children}
    </section>
  );
}

export function InfoCards({ items }: { items: { title: string; body: ReactNode; tag?: string }[] }) {
  return (
    <ul className="info-cards">
      {items.map((item) => (
        <li key={item.title} className="info-card">
          {item.tag && <span className="info-card__tag">{item.tag}</span>}
          <h3 className="info-card__title">{item.title}</h3>
          <div className="info-card__body">{item.body}</div>
        </li>
      ))}
    </ul>
  );
}

export function DemoCta({ title = "See it for yourself in a free demo class" }: { title?: string }) {
  return (
    <section className="info-cta" data-nav-theme="dark">
      <div>
        <h2 className="info-cta__title">{title}</h2>
        <p>
          20 minutes with an Upstep coach: a live class, an assessment of your child’s chess level, and a personalised
          roadmap, followed by a free counselling session.
        </p>
      </div>
      <BookDemoButton />
    </section>
  );
}
