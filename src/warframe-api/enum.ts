import { CycleName, VoidTier } from './world-state/vo/enum';

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

/** enum 값은 커맨드 이름(archon-hunt)이라 표시용 이름을 따로 둔다 */
export const TargetCommandLabel: Record<TargetCommand, string> = {
  [TargetCommand.ArchonHunt]: 'Archon Hunt',
  [TargetCommand.Sortie]: 'Sortie',
  [TargetCommand.Events]: 'Events',
  [TargetCommand.VoidFissures]: 'Void Fissures',
  [TargetCommand.VoidTrader]: 'Void Trader',
  [TargetCommand.Cycles]: 'World Cycles',
  [TargetCommand.Nightwave]: 'Nightwave',
  [TargetCommand.Archimedea]: 'Archimedea',
};

/** 🔔 리마인더를 걸 수 있는 대상 — 기준 시각이 하나로 정해지는 것만 */
export const RemindTarget = {
  Sortie: TargetCommand.Sortie,
  ArchonHunt: TargetCommand.ArchonHunt,
  Archimedea: TargetCommand.Archimedea,
  Cycles: TargetCommand.Cycles,
  VoidTrader: TargetCommand.VoidTrader,
} as const;

export type RemindTarget = (typeof RemindTarget)[keyof typeof RemindTarget];

export const isRemindTarget = (value: string): value is RemindTarget =>
  (Object.values(RemindTarget) as string[]).includes(value);

export type AlarmRequest =
  | { target: TargetCommand.ArchonHunt }
  | { target: TargetCommand.Sortie }
  | { target: TargetCommand.Events }
  | { target: TargetCommand.VoidFissures; options?: VoidTier }
  | { target: TargetCommand.VoidTrader }
  | { target: TargetCommand.Cycles; options?: CycleName }
  | { target: TargetCommand.Nightwave }
  | { target: TargetCommand.Archimedea };
