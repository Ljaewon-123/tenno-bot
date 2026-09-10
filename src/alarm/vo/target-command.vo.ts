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

/**
 * 알람이 가리키는 슬래시 커맨드 한 줄. **옵션을 떨구면 안 된다** — 확인 카드·목록·잘린 push가
 * 전부 이 문자열로 "나머지를 보려면 여기"를 말하는데, `tier:`가 빠지면 눌러서 간 화면이
 * 알람이 보내던 것과 다른 목록이다(균열 접힌 줄이 필터를 같이 싣는 것과 같은 이유).
 * 좁힘 옵션을 가진 대상은 균열뿐이다 — 사이클 지역은 `/cycles`에 옵션이 없어 실을 자리가 없다.
 */
export const commandPath = ({ target, options }: TargetCommandAlarm) =>
  target === TargetCommand.VoidFissures && options
    ? `/${target} tier:${options}`
    : `/${target}`;
