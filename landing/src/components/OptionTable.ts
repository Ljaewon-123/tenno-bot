import { html, type RawHtml } from '../lib/html.ts';
import { Chip } from './Chip.ts';
import type { CommandOption } from '../data/commands.ts';

interface OptionTableProps {
  options: CommandOption[];
}

// sm(190+100+110px 고정 트랙 + gap)부터만 4열 그리드를 쓴다 — 360px 폭에서는 그 폭 합이 뷰포트를
// 넘어 overflow-hidden이 Type/Required/Description을 잘라 먹는다. sm 밑에서는 각 행을 flex-wrap으로
// 풀어 이름·타입·필수 배지를 한 줄에 감싸 배치하고, description에만 basis-full을 줘서 항상 다음 줄로
// 떨어뜨린다 — 열을 다시 나누지 않고 같은 4개 자식만으로 모바일/데스크톱 두 레이아웃을 낸다.
const HEADER_ROW =
  'hidden bg-surface-2 px-5 py-3 text-xs font-bold text-text-faint sm:grid sm:grid-cols-[190px_100px_110px_minmax(0,1fr)] sm:gap-3';
const OPTION_ROW =
  'flex flex-wrap items-baseline gap-x-3 gap-y-1.5 border-t border-border px-5 py-3.5 text-base ' +
  'sm:grid sm:grid-cols-[190px_100px_110px_minmax(0,1fr)] sm:flex-nowrap sm:gap-3';

// Discord가 실제로 등록한 옵션 그대로 — required는 Palette가 'comms' 톤을 겸용으로 쓰라고 정한 것
// (Palette.dc.html 주석: comms "Alerts; also 'required'"), optional은 surface-2로 눌러둔다.
export function OptionTable({ options }: OptionTableProps): RawHtml {
  return html`<div class="overflow-hidden rounded-2xl border border-border">
    <div class="${HEADER_ROW}">
      <span>Option</span><span>Type</span><span>Required</span><span>Description</span>
    </div>
    ${options.map(
      (opt) => html`<div class="${OPTION_ROW}">
        <span class="font-mono text-sm text-text">${opt.name}</span>
        <span class="text-[15px] text-text-muted">${opt.type}</span>
        <span
          >${opt.required
            ? Chip({ label: 'yes', tone: 'comms' })
            : html`<span class="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-text-muted">optional</span>`}</span
        >
        <span class="basis-full leading-relaxed text-text-muted sm:basis-auto"
          >${opt.description}${opt.choices ? html` <span class="text-text-faint">(${opt.choices.join(', ')})</span>` : ''}</span
        >
      </div>`,
    )}
  </div>`;
}
