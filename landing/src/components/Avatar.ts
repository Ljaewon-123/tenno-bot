import { html, type RawHtml } from '../lib/html.ts';

interface AvatarProps {
  /** 지름(px) — 나오는 자리마다 목업 크기가 달라서(36~140) 호출부에서 지정 */
  size: number;
  class?: string;
}

// width/height 속성은 Tailwind preflight의 `img { height: auto }`에 져서 flex 안에서 세로로 늘어난다 — 인라인 style로 고정.
// 바로 옆에 항상 "Teno" 텍스트가 있어 장식 이미지로 취급한다(alt 비움). 최대 140px 표시라 원본 대신 320px로 줄인 사본을 쓴다.
export function Avatar({ size, class: className = '' }: AvatarProps): RawHtml {
  return html`<img
    src="/avatar.jpg"
    alt=""
    class="shrink-0 rounded-full object-cover ${className}"
    style="width:${size}px;height:${size}px;"
  />`;
}
