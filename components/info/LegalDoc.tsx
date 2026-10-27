import type { ReactNode } from "react";
import LegalToc from "./LegalToc";
import "./legalDoc.scss";

// Long legal pages (Privacy Policy): a contents list that stays in view beside
// the text on desktop, numbered sections, sub-headed clauses and two-column
// tables. Sits inside InfoPage, after its InfoHero.

export type LegalSectionData = { id: string; title: string; body: ReactNode };

export function LegalDoc({ intro, sections }: { intro?: ReactNode; sections: LegalSectionData[] }) {
  return (
    <div className="legal-doc">
      <LegalToc sections={sections.map(({ id, title }) => ({ id, title }))} />
      <article className="legal-doc__body">
        {intro}
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="legal-section">
            <h2 className="legal-section__title">{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  );
}

export function LegalClause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="legal-clause">
      <h3 className="legal-clause__title">{title}</h3>
      {children}
    </div>
  );
}

// Two columns; on phones each row stacks into a block, its first cell in bold.
export function LegalTable({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <table className="legal-table">
      <thead>
        <tr>
          <th scope="col">{head[0]}</th>
          <th scope="col">{head[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b]) => (
          <tr key={a}>
            <th scope="row">
              {a}
            </th>
            <td>{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
