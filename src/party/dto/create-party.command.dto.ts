import { EnumOption } from '@/utils/decorators/enum-option.js';
import { Expose } from 'class-transformer';
import { IntegerOption, StringOption } from 'necord';
import { PartyVisibility } from '../vo/enum.js';

export class CreatePartyCommand {
  @Expose()
  @StringOption({
    name: 'name',
    description: 'Party name',
    required: true,
    // 모달과 같은 한도 — 길면 /party list 합산 4000자를 넘겨 서버 목록 전체가 가려진다
    max_length: 100,
  })
  name: string;

  @Expose()
  @StringOption({
    name: 'mission',
    description: 'Mission to run',
    required: true,
    max_length: 100,
  })
  mission: string;

  @Expose()
  @IntegerOption({
    name: 'size',
    description: 'Party size (default 4)',
    min_value: 2,
    max_value: 4,
  })
  size?: number;

  @Expose()
  @EnumOption({
    enum: PartyVisibility,
    name: 'visibility',
    description: 'Who you are recruiting (label only — anyone can still enter)',
  })
  visibility?: PartyVisibility;
}
