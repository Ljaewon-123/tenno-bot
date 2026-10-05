import { html, type RawHtml } from '../lib/html.ts';
import { DocsTopBar } from './DocsTopBar.ts';
import { SiteFooter } from './SiteFooter.ts';
import type { FooterLink } from '../data/types.ts';

export interface LegalSection {
  title: string;
  body: RawHtml;
}

interface LegalPageProps {
  title: string;
  updated: string;
  sections: LegalSection[];
  footerLinks: FooterLink[];
  homeHref: string;
  githubHref: string;
  inviteHref?: string;
}

function Section({ title, body }: LegalSection): RawHtml {
  return html`<section class="flex flex-col gap-3">
    <h2 class="font-display text-2xl font-bold text-text">${title}</h2>
    ${body}
  </section>`;
}

// privacy.ts/terms.ts가 똑같이 쓰던 페이지 뼈대(top bar + 제목 + 섹션 목록 + footer)를 여기 한곳으로 모은다.
export function LegalPage({ title, updated, sections, footerLinks, homeHref, githubHref, inviteHref }: LegalPageProps): RawHtml {
  return html`<div class="flex min-h-screen flex-col bg-bg">
    ${DocsTopBar({ homeHref, githubHref, inviteHref, showSearch: false })}
    <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-14 sm:px-9 lg:py-20">
      <div class="flex flex-col gap-3">
        <h1 class="font-display text-4xl font-extrabold text-text sm:text-5xl">${title}</h1>
        <p class="text-sm font-semibold text-text-faint">Last updated ${updated}</p>
      </div>
      <div class="flex flex-col gap-9 text-lg leading-relaxed text-text-muted">${sections.map(Section)}</div>
    </main>
    ${SiteFooter({ links: footerLinks })}
  </div>`;
}
