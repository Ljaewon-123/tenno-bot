import { raw, type RawHtml } from '../lib/html.ts';
import type { FeatureIconKey } from '../data/landing.ts';

// 목업 그대로 옮긴 고정 SVG 경로 — 사용자 입력이 섞이지 않아 raw()로 통째로 신뢰한다.
// stroke="currentColor"로 둬서 부모 요소의 text-<tone> 클래스 색을 그대로 물려받는다.
const ICON_PATHS: Record<FeatureIconKey, string> = {
  intel: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path>',
  loot: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z"></path><path d="M4 7.5 12 12l8-4.5M12 12v9"></path>',
  ops: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"></path><path d="M10 21h4"></path>',
  comms: '<path d="M4 5h16v11H9l-5 4Z"></path><path d="M8 9.5h8M8 12.5h5"></path>',
  squad:
    '<circle cx="9" cy="9" r="3.2"></circle><circle cx="16.5" cy="10" r="2.6"></circle>' +
    '<path d="M3.5 19c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5M14.5 14.6c2.6-.4 5 .9 6 4.4"></path>',
};

interface FeatureIconProps {
  iconKey: FeatureIconKey;
}

/** Feature 카드 아이콘 — 데이터(FeatureIconKey)는 어떤 아이콘인지 이름만 들고, 실제 SVG는 이 컴포넌트가 소유한다. */
export function FeatureIcon({ iconKey }: FeatureIconProps): RawHtml {
  return raw(
    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${ICON_PATHS[iconKey]}</svg>`,
  );
}
