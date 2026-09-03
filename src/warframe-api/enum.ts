import { VoidTier } from './world-state/vo/enum';

export enum TargetCommand {
  ArchonHunt = 'archon-hunt',
  Sortie = 'sortie',
  Events = 'events',
  VoidFissures = 'void-fissures',
  VoidTrader = 'void-trader',
  Cycles = 'cycles',
  Nightwave = 'nightwave',
  Archimedea = 'archimedea',
}

export type AlarmRequest =
  | { target: TargetCommand.ArchonHunt }
  | { target: TargetCommand.Sortie }
  | { target: TargetCommand.Events }
  | { target: TargetCommand.VoidFissures; options?: VoidTier }
  | { target: TargetCommand.VoidTrader }
  | { target: TargetCommand.Cycles }
  | { target: TargetCommand.Nightwave }
  // 알람/구독은 항상 심층+시간 둘 다 — 타입 필터는 슬래시 커맨드에만 있다
  | { target: TargetCommand.Archimedea };
