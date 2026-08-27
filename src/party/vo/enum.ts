import type { Party } from '../entities/party.entity';

export enum PartyStatus {
  OPEN = 'open',
  CLOSE = 'close',
}

/** 커맨드가 넘겨주는 생성 입력 — 나머지 컬럼은 서비스가 채운다 */
export type CreateParty = Pick<
  Party,
  'guildId' | 'channelId' | 'hostUserId' | 'name' | 'mission' | 'partySize'
>;
