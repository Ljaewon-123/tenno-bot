import { html, type RawHtml } from '../lib/html.ts';

export interface FooterLink {
  href: string;
  label: string;
}

interface SiteFooterProps {
  links: FooterLink[];
  /** Warframe 상표/비제휴 고지 — 페이지마다 문구가 같아 기본값을 두되 필요하면 덮어쓸 수 있게 둔다. */
  notice?: string;
}

const DEFAULT_NOTICE = "Fan-made. Not affiliated with Digital Extremes. Warframe is a trademark of Digital Extremes Ltd.";

// docs/privacy/terms에서도 링크 목록만 바꿔 그대로 재사용한다.
export function SiteFooter({ links, notice = DEFAULT_NOTICE }: SiteFooterProps): RawHtml {
  return html`<footer class="mt-auto flex flex-col items-start gap-6 border-t border-border px-6 py-9 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-24">
    <div class="flex flex-col gap-1.5">
      <span class="font-display text-lg font-extrabold text-text">Teno</span>
      <span class="text-sm text-text-faint">${notice}</span>
    </div>
    <nav class="flex flex-wrap gap-6 text-base font-bold">
      ${links.map((link) => html`<a href="${link.href}" class="text-text-muted hover:text-text">${link.label}</a>`)}
    </nav>
  </footer>`;
}
