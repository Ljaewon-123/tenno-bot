import { html, type RawHtml } from '../lib/html.ts';

interface AvatarProps {
  /** 지름(px) — 나오는 자리마다 목업 크기가 달라서(40/42/112/140) 호출부에서 지정 */
  size: number;
  /** 실제 아바타 이미지가 없어 자리표시자 텍스트 — 이 파일 하나만 나중에 실이미지로 교체하면 됨 */
  label?: string;
  class?: string;
}

// 점선 원 placeholder. 실제 아바타 이미지가 준비되면 이 컴포넌트 내부만 바꾸면 전체 페이지에 반영된다.
export function Avatar({ size, label = 'AV', class: className = '' }: AvatarProps): RawHtml {
  const fontSize = Math.max(10, Math.round(size * 0.115));
  return html`<span
    class="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-accent bg-surface-2 font-mono font-medium text-accent-text ${className}"
    style="width:${size}px;height:${size}px;font-size:${fontSize}px;"
    aria-hidden="true"
  >${label}</span>`;
}
