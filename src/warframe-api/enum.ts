import { VoidTier } from './world-state/vo/enum';

export enum TargetCommand {
  ArchonHunt = 'archon-hunt',
  Sortie = 'sortie',
  Events = 'events',
  VoidFissures = 'void-fissures',
  VoidTrader = 'void-trader',
}

export type AlarmRequest =
  | { target: TargetCommand.ArchonHunt }
  | { target: TargetCommand.Sortie }
  | { target: TargetCommand.Events }
  | { target: TargetCommand.VoidFissures; options?: VoidTier }
  | { target: TargetCommand.VoidTrader };
