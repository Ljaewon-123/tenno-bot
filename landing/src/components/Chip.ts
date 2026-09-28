import { html, type RawHtml } from '../lib/html.ts';
import type { ChipTone } from '../data/types.ts';

export type { ChipTone };

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
  // OptionTable의 "optional" 배지가 Chip 클래스를 그대로 베껴 쓰던 걸 이 톤 하나로 합친다.
  muted: 'bg-surface-2 text-text-muted',
};

// 사이드바 카테고리 점처럼 배경 전체를 톤 색으로 채워야 하는 자리용 — TONE_CLASSES는 옅은 배경 위에
// 톤 텍스트를 얹는 조합이라 이 용도엔 못 쓴다. 같은 톤 이름 집합이라 여기 한곳에 모아둔다.
export const DOT_CLASSES: Record<ChipTone, string> = {
  intel: 'bg-intel',
  loot: 'bg-loot',
  ops: 'bg-ops',
  comms: 'bg-comms',
  squad: 'bg-squad',
  common: 'bg-common',
  uncommon: 'bg-uncommon',
  rare: 'bg-rare',
  muted: 'bg-surface-2',
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
