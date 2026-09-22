import { html, type RawHtml } from '../lib/html.ts';
import { COMMANDS, GETTING_STARTED } from '../data/commands.ts';

// 단일 페이지라 "현재 위치" 자체가 없다 — 스크롤스파이 없이 최상위 섹션(시작하기 항목 + 커맨드)만
// 나열한다(태스크 브리프 룰링). xl 미만에서는 숨긴다.
export function OnThisPage(): RawHtml {
  return html`<aside aria-label="On this page" class="hidden w-[216px] shrink-0 flex-col gap-1 px-6 pb-6 pt-8 text-sm xl:flex">
    <div class="pb-1.5 text-xs font-bold text-text-faint">On this page</div>
    ${GETTING_STARTED.map(
      (item) => html`<a href="#${item.id}" class="rounded-lg px-3 py-1.5 text-text-muted hover:text-text">${item.label}</a>`,
    )}
    ${COMMANDS.map(
      (command) =>
        html`<a href="#${command.id}" class="rounded-lg px-3 py-1.5 font-mono text-[13px] text-text-muted hover:text-text">/${command.id}</a>`,
    )}
  </aside>`;
}
