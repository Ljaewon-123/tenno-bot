import { RemindTarget } from '@/warframe-api/enum.js';
import { CycleName } from '@/warframe-api/world-state/vo/enum.js';

export type RemindInput = {
  guildId: string;
  /** DM이 막혔을 때 떨굴 자리 */
  channelId: string | null;
  userId: string;
  target: RemindTarget;
  option?: CycleName;
};
