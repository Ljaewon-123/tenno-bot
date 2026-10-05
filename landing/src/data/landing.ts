import type { ChipTone, NavLink } from './types.ts';
import { DOCS_HREF, HIDE } from './links.ts';

export const NAV_LINKS: NavLink[] = [
  { href: '#features', label: 'Features' },
  { href: DOCS_HREF, label: 'Docs' },
  ...(HIDE.kofi ? [] : [{ href: '#support', label: 'Support' }]),
];

export type FeatureIconKey = 'intel' | 'loot' | 'ops' | 'comms' | 'squad';

export interface Feature {
  tone: ChipTone;
  /** 실제 SVG는 components/FeatureIcon.ts가 그린다 — 데이터는 어떤 아이콘인지 키만 든다. */
  iconKey: FeatureIconKey;
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
    iconKey: 'intel',
    chipLabel: 'Intel',
    title: 'Live worldstate',
    desc: "Sortie, Archon Hunt, fissures, open-world cycles, Nightwave, Archimedea, events and Baro Ki'Teer.",
    commands: '/sortie /void-fissures /cycles',
  },
  {
    tone: 'loot',
    iconKey: 'loot',
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
    iconKey: 'ops',
    chipLabel: 'Ops',
    title: 'Alarms',
    desc: 'Post any info card on repeat in your timezone. Axi fissures every 30 minutes? Done.',
    commands: '/alarm',
  },
  {
    tone: 'comms',
    iconKey: 'comms',
    chipLabel: 'Comms',
    title: 'Worldstate alerts',
    desc: 'Subscribe a channel and Teno posts as soon as a new Sortie, hunt or event goes live.',
    commands: '/notification',
  },
  {
    tone: 'squad',
    iconKey: 'squad',
    chipLabel: 'Squad',
    title: 'Squad recruiting',
    desc: "Open a party and let people join with one button. It tidies itself up when full or expired.",
    commands: '/party',
  },
];

/** 문단 조각: text만 있으면 그대로, command도 있으면 text 뒤에 커맨드 참조(모노스페이스)가 붙는다. */
export interface DescSegment {
  text: string;
  command?: string;
}

/** step 2는 지원 색(text-support) 계열이라 Chip 톤과 이름이 안 맞아 스텝 전용 톤을 따로 둔다 —
 * 실제 Tailwind 클래스는 components/StepCard.ts가 갖고 있고, 데이터는 이 이름만 든다. */
export type StepTone = 'intel' | 'support' | 'ops';

export interface Step {
  num: 1 | 2 | 3;
  tone: StepTone;
  title: string;
  desc: string | DescSegment[];
}

export const STEPS: Step[] = [
  {
    num: 1,
    tone: 'intel',
    title: 'Invite Teno',
    desc: 'Pick your server and hit authorize. No setup page, no dashboard.',
  },
  {
    num: 2,
    tone: 'support',
    title: 'Type a slash',
    desc: [
      { text: "Every command shows up in Discord’s ", command: '/' },
      { text: ' menu. Start with ', command: '/help' },
      { text: '.' },
    ],
  },
  {
    num: 3,
    tone: 'ops',
    title: 'Let Teno keep watch',
    desc: 'Set alarms or subscribe a channel, then get back to farming.',
  },
];
