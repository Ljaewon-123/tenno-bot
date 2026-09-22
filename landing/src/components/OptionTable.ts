import { html, type RawHtml } from '../lib/html.ts';
import { Chip } from './Chip.ts';
import type { CommandOption } from '../data/commands.ts';

interface OptionTableProps {
  options: CommandOption[];
}

const GRID = 'grid grid-cols-[170px_84px_92px_minmax(0,1fr)] gap-3 sm:grid-cols-[190px_100px_110px_minmax(0,1fr)]';

// Discord가 실제로 등록한 옵션 그대로 — required는 Palette가 'comms' 톤을 겸용으로 쓰라고 정한 것
// (Palette.dc.html 주석: comms "Alerts; also 'required'"), optional은 surface-2로 눌러둔다.
export function OptionTable({ options }: OptionTableProps): RawHtml {
  return html`<div class="overflow-hidden rounded-2xl border border-border">
    <div class="${GRID} bg-surface-2 px-5 py-3 text-xs font-bold text-text-faint">
      <span>Option</span><span>Type</span><span>Required</span><span>Description</span>
    </div>
    ${options.map(
      (opt) => html`<div class="${GRID} items-baseline border-t border-border px-5 py-3.5 text-base">
        <span class="font-mono text-sm text-text">${opt.name}</span>
        <span class="text-[15px] text-text-muted">${opt.type}</span>
        <span
          >${opt.required
            ? Chip({ label: 'yes', tone: 'comms' })
            : html`<span class="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-text-muted">optional</span>`}</span
        >
        <span class="leading-relaxed text-text-muted"
          >${opt.description}${opt.choices ? html` <span class="text-text-faint">(${opt.choices.join(', ')})</span>` : ''}</span
        >
      </div>`,
    )}
  </div>`;
}
