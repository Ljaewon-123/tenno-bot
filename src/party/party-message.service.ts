import {
  Accent,
  bold,
  button,
  card,
  payload,
  relative,
  subtext,
} from '@/utils/discord-embed';
import { Injectable } from '@nestjs/common';
import { ButtonStyle } from 'discord.js';
import { PARTY_EXPIRE_HOURS } from './constants';
import { Party } from './entities/party.entity';
import { PartyStatus, PartyVisibilityLabel } from './vo/enum';

@Injectable()
export class PartyMessageService {
  expiresAt(party: Party) {
    return party.createdAt.add(PARTY_EXPIRE_HOURS, 'hour');
  }

  build(party: Party) {
    const open = party.status === PartyStatus.OPEN;
    const full = party.members.length >= party.partySize;
    const mention = (userId: string) => `<@${userId}>`;

    if (!open)
      return payload(
        card({
          accent: Accent.Muted,
          title: `${party.name} · Closed`,
          subtitle: party.mission,
          blocks: [
            [
              party.members.length
                ? `Ran with ${party.members.length} · ${party.members.map(mention).join(' · ')}`
                : 'Nobody joined.',
            ],
          ],
          footer: `Closed ${relative(party.updatedAt)} · /party create to start a new one`,
        }),
      );

    return payload(
      card({
        accent: full ? Accent.Success : Accent.Default,
        title: full ? `${party.name} · Full` : party.name,
        subtitle: `${party.mission} · ${PartyVisibilityLabel[party.visibility]}`,
        blocks: [
          [
            {
              heading: `${party.members.length} / ${party.partySize}`,
              lines: [
                ...party.members.map(
                  (userId) =>
                    `${mention(userId)}${userId === party.hostUserId ? ` ${subtext('host')}` : ''}`,
                ),
                !full &&
                  subtext(
                    `${party.partySize - party.members.length} slots open`,
                  ),
              ],
            },
          ],
        ],
        buttons: this.buttons(party, full),
        footer: `Closes ${relative(this.expiresAt(party))}`,
      }),
    );
  }

  /** Done은 호스트만 되지만 메시지는 한 장이라 뷰어별로 못 막는다 — 서비스가 거절한다 */
  private buttons(party: Party, full: boolean) {
    return [
      button(`party/join/${party.id}`, 'Enter', ButtonStyle.Success, full),
      button(`party/leave/${party.id}`, 'Exit', ButtonStyle.Secondary),
      button(`party/close/${party.id}`, 'Done', ButtonStyle.Danger),
    ];
  }

  /** 목록·기록에서 파티 한 줄 요약 */
  line(party: Party) {
    return `${bold(party.name)} · ${party.mission} · ${PartyVisibilityLabel[party.visibility]} · ${party.members.length}/${party.partySize} · host <@${party.hostUserId}>`;
  }

  /** 정원이 찬 순간만 별개 메시지로 멘션한다 — 메시지 갱신만으론 알림이 안 뜬다 */
  fullNotice(party: Party) {
    return {
      content: `Party is full! ${party.members.map((userId) => `<@${userId}>`).join(' ')}`,
    };
  }
}
