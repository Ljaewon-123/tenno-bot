import { html, type RawHtml } from '../lib/html.ts';
import { DOT_CLASSES } from './Chip.ts';
import type { SidebarSection } from '../data/commands.ts';

interface DocsSidebarProps {
  gettingStarted: { id: string; label: string }[];
  sections: SidebarSection[];
}

// data-cmd-name/data-cmd-desc는 scripts/docs-search.ts가 읽는 훅 — 데이터를 JS에 다시 심지 않고
// 이미 그려진 마크업에서 읽게 해서 소스가 하나로 유지된다.
function sidebarGroups({ gettingStarted, sections }: DocsSidebarProps): RawHtml {
  return html`<div class="flex flex-col gap-0.5" data-sidebar-group>
      <div class="px-3.5 pb-1.5 text-xs font-bold text-text-faint">Getting started</div>
      ${gettingStarted.map(
        (item) =>
          html`<a
            href="#${item.id}"
            data-cmd-name="${item.label}"
            data-cmd-desc=""
            class="rounded-xl px-3.5 py-2 text-text-muted hover:bg-surface-2 hover:text-text"
            >${item.label}</a
          >`,
      )}
    </div>
    ${sections.map(
      (section) => html`<div class="flex flex-col gap-0.5" data-sidebar-group>
        <div class="flex items-center gap-2 px-3.5 pb-1.5 text-xs font-bold text-text-faint">
          <span class="h-2 w-2 rounded-full ${DOT_CLASSES[section.dotCategory]}" aria-hidden="true"></span>${section.title}
        </div>
        ${section.commands.map(
          (command) =>
            html`<a
              href="#${command.id}"
              data-cmd-name="/${command.id}"
              data-cmd-desc="${command.description}"
              class="rounded-xl px-3.5 py-2 text-text-muted hover:bg-surface-2 hover:text-text"
              >/${command.id}</a
            >`,
        )}
      </div>`,
    )}`;
}

// 360px 폭에서는 사이드바가 접힌 <details>로, lg 이상에서는 고정 사이드바로 — 같은 링크 목록을
// 두 번 렌더한다(JS 없이 CSS만으로 전환하려면 이 쪽이 스크롤스파이보다 훨씬 단순하다).
// data-docs-sidebar는 scripts/docs-search.ts가 검색어 입력 시 모바일 <details>를 강제로 펼치는 훅.
export function DocsSidebar(props: DocsSidebarProps): RawHtml {
  const groups = sidebarGroups(props);
  return html`<details class="border-b border-border px-6 py-4 lg:hidden" data-docs-sidebar>
      <summary class="cursor-pointer font-display text-sm font-bold text-text">Browse commands</summary>
      <nav aria-label="Docs" class="mt-3 flex flex-col gap-5">${groups}</nav>
    </details>
    <nav aria-label="Docs" class="hidden w-[272px] shrink-0 flex-col gap-5 px-4 py-6 text-base lg:flex">${groups}</nav>`;
}
