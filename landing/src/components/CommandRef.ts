import { html, type RawHtml } from '../lib/html.ts';

export type CommandRefTone = 'default' | 'accent' | 'support';

// docs/privacy/landing 전체에서 반복되던 인라인 커맨드 표기(font-mono + 톤별 색상) 클래스를 한곳에 모은다.
const TONE_CLASSES: Record<CommandRefTone, string> = {
  default: 'font-mono text-sm text-text',
  accent: 'font-mono text-accent-text',
  support: 'font-mono text-support',
};

interface CommandRefProps {
  children: string;
  tone?: CommandRefTone;
}

/** 본문 중간에서 슬래시 커맨드/옵션 이름을 가리키는 인라인 조각. */
export function CommandRef({ children, tone = 'default' }: CommandRefProps): RawHtml {
  return html`<span class="${TONE_CLASSES[tone]}">${children}</span>`;
}
