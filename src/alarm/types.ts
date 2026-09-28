import { RemindTarget } from '@/warframe-api/enum';
import { CycleName } from '@/warframe-api/world-state/vo/enum';

export type RemindInput = {
  guildId: string;
  /** DM이 막혔을 때 떨굴 자리 */
  channelId: string | null;
  userId: string;
  target: RemindTarget;
  option?: CycleName;
};
