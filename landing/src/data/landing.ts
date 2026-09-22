import { raw, type RawHtml } from '../lib/html.ts';
import type { ChipTone } from '../components/Chip.ts';
import type { FooterLink } from '../components/SiteFooter.ts';
import type { NavLink } from '../components/SiteNav.ts';
import { DOCS_HREF, GITHUB_REPO_URL, PRIVACY_HREF, SUPPORT_SERVER_URL, TERMS_HREF } from './links.ts';

export const NAV_LINKS: NavLink[] = [
  { href: '#features', label: 'Features' },
  { href: DOCS_HREF, label: 'Docs' },
  { href: '#support', label: 'Support' },
];

export const FOOTER_LINKS: FooterLink[] = [
  { href: DOCS_HREF, label: 'Docs' },
  { href: PRIVACY_HREF, label: 'Privacy' },
  { href: TERMS_HREF, label: 'Terms' },
  { href: GITHUB_REPO_URL, label: 'GitHub' },
  { href: SUPPORT_SERVER_URL, label: 'Support server' },
];

// 아이콘은 디자인 목업에서 그대로 옮긴 고정 SVG라 사용자 입력이 섞이지 않는다 — raw()로 통째로 신뢰.
// stroke="currentColor"로 둬서 부모 요소의 text-<tone> 클래스 색을 그대로 물려받는다.
function icon(paths: string): RawHtml {
  return raw(
    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${paths}</svg>`,
  );
}

export interface Feature {
  tone: ChipTone;
  icon: RawHtml;
  chipLabel: string;
  title: string;
  desc: string;
  commands: string;
  /** Loot 카드에만 있는 희귀도 태그 줄 */
  rarityChips?: { label: string; tone: ChipTone }[];
}

export const FEATURES: Feature[] = [
  {
    tone: 'intel',
    icon: icon('<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path>'),
    chipLabel: 'Intel',
    title: 'Live worldstate',
    desc: "Sortie, Archon Hunt, fissures, open-world cycles, Nightwave, Archimedea, events and Baro Ki'Teer.",
    commands: '/sortie /void-fissures /cycles',
  },
  {
    tone: 'loot',
    icon: icon('<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z"></path><path d="M4 7.5 12 12l8-4.5M12 12v9"></path>'),
    chipLabel: 'Loot',
    title: 'Drops & relics',
    desc: 'Where an item drops, what a relic can give and every Incarnon evolution with its cost.',
    commands: '/drop /relic /incarnon',
    rarityChips: [
      { label: 'Common', tone: 'common' },
      { label: 'Uncommon', tone: 'uncommon' },
      { label: 'Rare', tone: 'rare' },
    ],
  },
  {
    tone: 'ops',
    icon: icon('<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"></path><path d="M10 21h4"></path>'),
    chipLabel: 'Ops',
    title: 'Alarms',
    desc: 'Post any info card on repeat in your timezone. Axi fissures every 30 minutes? Done.',
    commands: '/alarm',
  },
  {
    tone: 'comms',
    icon: icon('<path d="M4 5h16v11H9l-5 4Z"></path><path d="M8 9.5h8M8 12.5h5"></path>'),
    chipLabel: 'Comms',
    title: 'Worldstate alerts',
    desc: 'Subscribe a channel and Teno posts as soon as a new Sortie, hunt or event goes live.',
    commands: '/notification',
  },
  {
    tone: 'squad',
    icon: icon(
      '<circle cx="9" cy="9" r="3.2"></circle><circle cx="16.5" cy="10" r="2.6"></circle><path d="M3.5 19c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5M14.5 14.6c2.6-.4 5 .9 6 4.4"></path>',
    ),
    chipLabel: 'Squad',
    title: 'Squad recruiting',
    desc: "Open a party and let people join with one button. It tidies itself up when full or expired.",
    commands: '/party',
  },
];

export interface Step {
  num: 1 | 2 | 3;
  /** step 2는 지원 색(#ffc98a 계열) 조합이라 Chip 톤과 정확히 안 맞아 스와치 클래스를 직접 지정 */
  swatchClass: string;
  title: string;
  desc: RawHtml;
}

export const STEPS: Step[] = [
  {
    num: 1,
    swatchClass: 'bg-intel-bg text-intel',
    title: 'Invite Teno',
    desc: raw('Pick your server and hit authorize. No setup page, no dashboard.'),
  },
  {
    num: 2,
    swatchClass: 'bg-loot-bg text-support',
    title: 'Type a slash',
    desc: raw(
      'Every command shows up in Discord’s <span class="font-mono text-support">/</span> menu. Start with <span class="font-mono text-support">/help</span>.',
    ),
  },
  {
    num: 3,
    swatchClass: 'bg-ops-bg text-ops',
    title: 'Let Teno keep watch',
    desc: raw('Set alarms or subscribe a channel, then get back to farming.'),
  },
];
