import { TargetCommand } from '@/warframe-api/enum';
import { VoidTier } from '@/warframe-api/world-state/vo/enum';
import { IsEnum, IsOptional } from 'class-validator';

export class TargetCommandAlarm {
  @IsEnum(TargetCommand)
  target: TargetCommand;

  @IsOptional()
  @IsEnum(VoidTier)
  options?: VoidTier;
}
