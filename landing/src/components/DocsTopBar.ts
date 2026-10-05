import { html, raw, type RawHtml } from '../lib/html.ts';
import { Avatar } from './Avatar.ts';
import { LinkButton } from './Button.ts';
import { BETA } from '../data/links.ts';

// 목업 그대로 옮긴 고정 SVG — 사용자 입력이 섞이지 않아 raw()로 통째로 신뢰.
const SEARCH_ICON = raw(
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="7" cy="7" r="5"></circle><path d="m11 11 4 4"></path></svg>',
);
const MOON_ICON = raw(
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg>',
);
const SUN_ICON = raw(
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"></path></svg>',
);

interface DocsTopBarProps {
  homeHref: string;
  githubHref: string;
  /** 베타 동안엔 비워서 초대 버튼을 숨긴다. */
  inviteHref?: string;
  /** privacy/terms엔 검색할 커맨드 목록 자체가 없다 — docs-search.ts도 그 페이지들엔 안 실리므로 입력창을 아예 뺀다. */
  showSearch?: boolean;
}

// 라이트/다크 아이콘 전환은 JS 없이 dark: 변형으로만 한다 — anti-flash 스크립트가 이미 <head>에서
// .dark를 건 채로 첫 페인트가 일어나므로 깜빡임이 없다. scripts/theme.ts는 클릭 처리만 담당.
export function DocsTopBar({ homeHref, githubHref, inviteHref, showSearch = true }: DocsTopBarProps): RawHtml {
  return html`<header class="flex flex-wrap items-center gap-4 border-b border-border bg-surface px-6 py-4 sm:px-7">
    <a href="${homeHref}" class="flex items-center gap-2.5 text-text">
      ${Avatar({ size: 36 })}
      <span class="font-display text-lg font-extrabold">Teno</span>
      ${BETA ? html`<span class="rounded-full bg-accent-soft px-2.5 py-0.5 text-[13px] font-bold text-accent-text">Beta</span>` : ''}
      <span class="rounded-full bg-surface-2 px-2.5 py-0.5 text-[13px] font-bold text-text-faint">Docs</span>
    </a>
    ${showSearch
      ? html`<label class="flex h-11 max-w-[460px] flex-grow items-center gap-2.5 rounded-full bg-surface-2 px-4">
      <span class="text-text-faint">${SEARCH_ICON}</span>
      <input
        type="search"
        placeholder="Search commands"
        aria-label="Search commands"
        data-docs-search
        class="w-full flex-grow bg-transparent text-base text-text outline-none placeholder:text-text-faint"
      />
    </label>`
      : ''}
    <div class="ml-auto flex items-center gap-2.5">
      <a href="${githubHref}" class="px-3.5 py-2.5 text-[15px] font-bold text-text-faint">GitHub</a>
      <button
        type="button"
        data-theme-toggle
        aria-label="Switch to dark mode"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-text"
      >
        <span class="dark:hidden">${MOON_ICON}</span>
        <span class="hidden dark:block">${SUN_ICON}</span>
      </button>
      ${inviteHref ? LinkButton({ href: inviteHref, label: 'Add to Discord', variant: 'primary', class: 'min-h-11 px-5 text-[15px]' }) : ''}
    </div>
  </header>`;
}
