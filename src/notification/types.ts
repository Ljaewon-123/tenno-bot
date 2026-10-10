import { TargetCommand } from '@/warframe-api/enum.js';

/** 변화로 감지 가능한 대상 — 균열은 상시 갱신이라 제외 */
export const WatchTarget = {
  Sortie: TargetCommand.Sortie,
  ArchonHunt: TargetCommand.ArchonHunt,
  Events: TargetCommand.Events,
  VoidTrader: TargetCommand.VoidTrader,
  Nightwave: TargetCommand.Nightwave,
  Archimedea: TargetCommand.Archimedea,
} as const;

export type WatchTarget = (typeof WatchTarget)[keyof typeof WatchTarget];

export { TargetCommandLabel as WatchTargetLabel } from '@/warframe-api/enum.js';
