import { html, type RawHtml } from '../lib/html.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'support';

// Tailwind는 소스에 그대로 등장하는 클래스 문자열만 스캔한다 — `bg-${variant}` 같은 조립식 문자열은
// 안 잡히므로 variant별 완성된 클래스 문자열을 그대로 나열해야 한다.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'bg-surface-2 text-text',
  outline: 'bg-surface text-text border border-border',
  support: 'bg-support text-on-support',
};

interface LinkButtonProps {
  href: string;
  label: string;
  variant: ButtonVariant;
  icon?: RawHtml;
  class?: string;
}

/** 목업의 pill 버튼들(Add to Discord / Read the docs / Ko-fi) 공용 링크-버튼. */
export function LinkButton({ href, label, variant, icon, class: className = '' }: LinkButtonProps): RawHtml {
  return html`<a
    href="${href}"
    class="inline-flex items-center justify-center gap-2.5 rounded-full font-display font-bold ${VARIANT_CLASSES[variant]} ${className}"
  >${icon ?? ''}${label}</a>`;
}
