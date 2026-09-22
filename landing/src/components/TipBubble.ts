import { html, type RawHtml } from '../lib/html.ts';
import { Avatar } from './Avatar.ts';

interface TipBubbleProps {
  text: string;
}

// 코드에서 확인되는 실제 제약(길드 전용, 채널 고정 등)만 짚어주는 말풍선.
// 디자인의 tip/tipText는 accent-soft/accent-text와 같은 계열이라 새 토큰 없이 그대로 쓴다.
export function TipBubble({ text }: TipBubbleProps): RawHtml {
  return html`<div class="flex items-start gap-3.5">
    ${Avatar({ size: 44 })}
    <div class="rounded-[4px_18px_18px_18px] bg-accent-soft px-4.5 py-3.5 text-base leading-relaxed text-accent-text">${text}</div>
  </div>`;
}
