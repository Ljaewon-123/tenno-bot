import type { Party } from './entities/party.entity';

export type CreateParty = Pick<
  Party,
  | 'guildId'
  | 'channelId'
  | 'hostUserId'
  | 'name'
  | 'mission'
  | 'partySize'
  | 'visibility'
>;
