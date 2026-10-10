import { TargetCommand } from '@/warframe-api/enum.js';
import { CycleName, VoidTier } from '@/warframe-api/world-state/vo/enum.js';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

export class TargetCommandAlarm {
  @IsEnum(TargetCommand)
  target: TargetCommand;

  /** 균열은 티어, 사이클은 지역. @IsEnum 둘을 합칠 수 없어 값 목록으로 검사한다 */
  @IsOptional()
  @IsIn([...Object.values(VoidTier), ...Object.values(CycleName)])
  options?: VoidTier | CycleName;

  /** 옵션을 떨구면 눌러서 간 화면이 알람이 보내던 목록과 달라진다. 좁힘 옵션이 있는 대상은 균열뿐 */
  static path({ target, options }: TargetCommandAlarm) {
    return target === TargetCommand.VoidFissures && options
      ? `/${target} tier:${options}`
      : `/${target}`;
  }
}
