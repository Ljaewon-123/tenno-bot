import { html, type RawHtml } from '../lib/html.ts';
import { CommandRef } from './CommandRef.ts';
import type { DescSegment, Step, StepTone } from '../data/landing.ts';

// Tailwind는 소스에 그대로 등장하는 클래스만 스캔한다 — tone별 완성 클래스를 나열해야 한다.
// support는 Chip 톤과 이름이 안 겹치는 지원색 조합(bg-loot-bg + text-support)이라 여기서만 쓴다.
const SWATCH_CLASSES: Record<StepTone, string> = {
  intel: 'bg-intel-bg text-intel',
  support: 'bg-loot-bg text-support',
  ops: 'bg-ops-bg text-ops',
};

function renderDesc(desc: Step['desc']): RawHtml {
  if (typeof desc === 'string') return html`${desc}`;
  return html`${desc.map((seg: DescSegment) => html`${seg.text}${seg.command ? CommandRef({ children: seg.command, tone: 'support' }) : ''}`)}`;
}

/** "Up and running in a minute" 3단계 카드. */
export function StepCard(step: Step): RawHtml {
  return html`<div class="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-7">
    <span class="flex h-11 w-11 items-center justify-center rounded-2xl font-display text-xl font-extrabold ${SWATCH_CLASSES[step.tone]}"
      >${step.num}</span
    >
    <h3 class="font-display text-xl font-bold text-text">${step.title}</h3>
    <p class="text-base leading-relaxed text-text-muted">${renderDesc(step.desc)}</p>
  </div>`;
}
