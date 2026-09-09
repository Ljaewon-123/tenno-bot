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
 * 🔔 1회용 리마인더를 걸 수 있는 대상 — "언제 일어나는가"가 하나로 정해지는 것만.
 * 균열·이벤트는 항목마다 시각이 달라 카드 단위 기준이 없고, 인카논·나이트웨이브는
 * 주기가 길거나 고정이라 몇 분 전 알림이 의미가 없다.
 *
 * **기준 시각은 대상마다 다르다** — 소티·집정관·아르키메디아는 만료, 사이클은 다음 전환,
 * 바로는 도착(activation)이다. 그걸 고르는 자리가 `WarframeApiService.remindMomentOf()`다.
 */
export const RemindTarget = {
  Sortie: TargetCommand.Sortie,
  ArchonHunt: TargetCommand.ArchonHunt,
  Archimedea: TargetCommand.Archimedea,
  /** 지역마다 따로 건다 — customId·토글 키에 `CycleName`이 같이 실린다 */
  Cycles: TargetCommand.Cycles,
  /** 유일하게 만료가 아니라 도착이 기준이다 */
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
  // 지역은 🔔 리마인더가 싣는다 — 카드는 세 지역을 다 그리므로 표시에는 안 쓴다
  | { target: TargetCommand.Cycles; options?: CycleName }
  | { target: TargetCommand.Nightwave }
  // 알람/구독은 항상 심층+시간 둘 다 — 타입 필터는 슬래시 커맨드에만 있다
  | { target: TargetCommand.Archimedea };
