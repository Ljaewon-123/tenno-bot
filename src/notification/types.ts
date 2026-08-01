import { TargetCommand } from '@/warframe-api/enum';

/** 내용 변화로 감지 가능한 대상 — 균열/보이드상인은 성격이 달라 제외 */
export type WatchTarget =
  TargetCommand.Sortie | TargetCommand.ArchonHunt | TargetCommand.Events;
