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
import { Party } from './entities/party.entity';
import { PartyStatus } from './vo/enum';

/** 이 시간이 지난 OPEN 파티는 크론이 자동 마감한다 */
export const PARTY_EXPIRE_HOURS = 3;

/** 커맨드·버튼·만료 크론이 공유하는 렌더러 — 세 곳의 메시지 모양이 갈라지지 않게 한다 */
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
          // 제목·본문까지 같이 죽여야 스크롤에서 "지나간 게시물"로 읽힌다
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
          // 버튼 행은 disabled가 아니라 통째로 제거한다
          footer: `Closed ${relative(party.updatedAt)} · /party create to start a new one`,
        }),
      );

    return payload(
      card({
        // 정원이 차도 파티를 닫지 않는다 — 초록은 "지금은 들어갈 자리가 없다"는 표시일 뿐이다
        accent: full ? Accent.Success : Accent.Default,
        title: full ? `${party.name} · Full` : party.name,
        subtitle: party.mission,
        blocks: [
          [
            {
              heading: `${party.members.length} / ${party.partySize}`,
              lines: party.members.length
                ? [
                    ...party.members.map(
                      (userId) =>
                        `${mention(userId)}${userId === party.hostUserId ? ` ${subtext('host')}` : ''}`,
                    ),
                    !full &&
                      subtext(
                        `${party.partySize - party.members.length} slots open`,
                      ),
                  ]
                : // 호스트가 자동 참가되지 않는 구조라 "빈 파티"가 실제로 존재한다
                  [
                    subtext(
                      `Host ${mention(party.hostUserId)} hasn't joined yet`,
                    ),
                  ],
            },
          ],
        ],
        buttons: this.buttons(party, full),
        // 3시간 뒤 크론이 조용히 닫으면 "갑자기 닫혔다"로 읽힌다
        footer: `Closes ${relative(this.expiresAt(party))}`,
      }),
    );
  }

  /**
   * disabled는 "지금 누르면 안 되는" 상태를 표현하는 유일한 수단이다.
   * Done은 호스트만 성공하지만 메시지는 한 장이라 뷰어별로 죽일 수 없다 — 서비스가 거절 문구로 막는다.
   */
  private buttons(party: Party, full: boolean) {
    const alone = party.members.length === 0;
    return [
      button(`party/join/${party.id}`, 'Enter', ButtonStyle.Success, full),
      button(`party/leave/${party.id}`, 'Exit', ButtonStyle.Secondary, alone),
      button(`party/close/${party.id}`, 'Done', ButtonStyle.Danger, alone),
    ];
  }

  /** 정원이 찬 순간만 별개 메시지로 멘션한다 — 메시지 갱신만으론 알림이 안 뜬다 */
  fullNotice(party: Party) {
    return {
      content: `Party is full! ${party.members.map((userId) => `<@${userId}>`).join(' ')}`,
    };
  }
}

/** 마감 목록·안내에서 파티 한 줄을 같은 모양으로 쓰기 위한 요약 */
export const partyLine = (party: Party) =>
  `${bold(party.name)} · ${party.mission} · ${party.members.length}/${party.partySize} · host <@${party.hostUserId}>`;
