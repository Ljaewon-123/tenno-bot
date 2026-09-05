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

/**
 * 표시용 이름. enum 값은 슬래시 커맨드 이름(`archon-hunt`)이라 그대로 찍으면
 * 카드 안에서만 소문자·하이픈으로 튄다.
 */
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

/**
 * 🔔 1회용 리마인더를 걸 수 있는 대상 — "이 카드의 만료"가 하나로 정해지는 것만.
 * 균열·이벤트는 항목마다 만료가 달라 카드 단위 만료가 없고, 인카논·나이트웨이브는
 * 주간 고정이라 30분 전 알림이 의미가 없다. 사이클은 지역별로 따로 걸어야 해서
 * 버튼 하나로 표현되지 않는다.
 */
export const RemindTarget = {
  Sortie: TargetCommand.Sortie,
  ArchonHunt: TargetCommand.ArchonHunt,
  Archimedea: TargetCommand.Archimedea,
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
  | { target: TargetCommand.Cycles }
  | { target: TargetCommand.Nightwave }
  // 알람/구독은 항상 심층+시간 둘 다 — 타입 필터는 슬래시 커맨드에만 있다
  | { target: TargetCommand.Archimedea };
