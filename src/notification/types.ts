import { TargetCommand } from '@/warframe-api/enum';

/**
 * 내용 변화로 감지 가능한 대상 — 균열은 상시 갱신이라 제외.
 * 슬래시 커맨드 choices와 `@IsEnum`에 그대로 쓰려고 값으로도 남긴다.
 */
export const WatchTarget = {
  Sortie: TargetCommand.Sortie,
  ArchonHunt: TargetCommand.ArchonHunt,
  Events: TargetCommand.Events,
  VoidTrader: TargetCommand.VoidTrader,
  Nightwave: TargetCommand.Nightwave,
  Archimedea: TargetCommand.Archimedea,
} as const;

export type WatchTarget = (typeof WatchTarget)[keyof typeof WatchTarget];

/**
 * 표시용 이름. enum 값은 슬래시 커맨드 이름(`archon-hunt`)이라 그대로 찍으면
 * 카드 안에서만 소문자·하이픈으로 튄다.
 */
export const WatchTargetLabel: Record<WatchTarget, string> = {
  [WatchTarget.Sortie]: 'Sortie',
  [WatchTarget.ArchonHunt]: 'Archon Hunt',
  [WatchTarget.Events]: 'Events',
  [WatchTarget.VoidTrader]: 'Void Trader',
  [WatchTarget.Nightwave]: 'Nightwave',
  [WatchTarget.Archimedea]: 'Archimedea',
};
