import { TargetCommand } from '@/warframe-api/enum';
import { CycleName, VoidTier } from '@/warframe-api/world-state/vo/enum';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

export class TargetCommandAlarm {
  @IsEnum(TargetCommand)
  target: TargetCommand;

  /**
   * 대상이 정하는 좁힘 값 — 균열은 티어, 사이클은 지역. `@IsEnum` 둘을 합칠 수 없어
   * 값 목록으로 검사한다(대상별로 어느 쪽인지는 타입이 말한다).
   */
  @IsOptional()
  @IsIn([...Object.values(VoidTier), ...Object.values(CycleName)])
  options?: VoidTier | CycleName;
}
