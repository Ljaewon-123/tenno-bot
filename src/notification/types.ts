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
} as const;

export type WatchTarget = (typeof WatchTarget)[keyof typeof WatchTarget];
