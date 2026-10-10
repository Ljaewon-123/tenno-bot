import type { Party } from './entities/party.entity.js';

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
