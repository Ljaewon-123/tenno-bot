import { html, type RawHtml } from '../lib/html.ts';
import { Avatar } from './Avatar.ts';
import { LinkButton } from './Button.ts';
import { BETA } from '../data/links.ts';
import type { NavLink } from '../data/types.ts';

export type { NavLink };

interface SiteNavProps {
  links: NavLink[];
  /** 베타 동안엔 비워서 초대 버튼을 숨긴다. */
  inviteHref?: string;
  /** docs 페이지의 검색창/테마 토글 등 Task 3~4에서 채울 훅 — landing은 비워둔다. */
  extra?: RawHtml;
}

// docs/privacy/terms에서도 그대로 재사용할 수 있도록 링크 목록은 호출부에서 주입한다.
export function SiteNav({ links, inviteHref, extra }: SiteNavProps): RawHtml {
  return html`<header class="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10 lg:px-24">
    <a href="#top" class="flex items-center gap-3 text-text">
      ${Avatar({ size: 40 })}
      <span class="font-display text-xl font-extrabold">Teno</span>
      ${BETA ? html`<span class="rounded-full bg-accent-soft px-2.5 py-0.5 text-[13px] font-bold text-accent-text">Beta</span>` : ''}
    </a>
    <nav class="flex flex-wrap items-center gap-2 text-base font-bold">
      ${links.map(
        (link) => html`<a href="${link.href}" class="rounded-full px-4 py-2.5 text-text-muted hover:text-text">${link.label}</a>`,
      )}
      ${extra ?? ''}
      ${inviteHref ? LinkButton({ href: inviteHref, label: 'Add to Discord', variant: 'primary', class: 'ml-1 min-h-11 px-5 text-base' }) : ''}
    </nav>
  </header>`;
}
