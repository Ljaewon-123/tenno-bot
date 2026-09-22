import { html, type RawHtml } from '../lib/html.ts';

export type ChipTone = 'intel' | 'loot' | 'ops' | 'comms' | 'squad' | 'common' | 'uncommon' | 'rare';

// Tailwind 정적 스캔 때문에 `bg-${tone}-bg` 같은 조립식 클래스는 안 잡힌다 — tone별 완성 클래스를 나열.
// features 카드 아이콘 배경도 같은 톤 매핑을 쓰므로 data/landing.ts에서 재사용할 수 있게 export.
export const TONE_CLASSES: Record<ChipTone, string> = {
  intel: 'bg-intel-bg text-intel',
  loot: 'bg-loot-bg text-loot',
  ops: 'bg-ops-bg text-ops',
  comms: 'bg-comms-bg text-comms',
  squad: 'bg-squad-bg text-squad',
  common: 'bg-common-bg text-common',
  uncommon: 'bg-uncommon-bg text-uncommon',
  rare: 'bg-rare-bg text-rare',
};

interface ChipProps {
  label: string;
  tone: ChipTone;
  class?: string;
}

/** 카테고리 태그(Intel/Loot/...)와 희귀도 태그(Common/Uncommon/Rare) 공용 pill. */
export function Chip({ label, tone, class: className = '' }: ChipProps): RawHtml {
  return html`<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${TONE_CLASSES[tone]} ${className}">${label}</span>`;
}
