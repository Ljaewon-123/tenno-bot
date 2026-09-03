import { Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from 'discord.js';
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
    const members = party.members.map((userId) => `<@${userId}>`).join(' ');

    const container = new ContainerBuilder()
      .setAccentColor(open ? 0x5865f2 : 0x4e5058)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${party.name}\n-# ${party.mission}`.slice(0, 4000),
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `**Members** \`${party.members.length}/${party.partySize}\``,
            members || '-# 아직 아무도 없다',
            // 3시간 뒤 크론이 조용히 닫으면 "갑자기 닫혔다"로 읽힌다. 디스코드가 뷰어 로컬 시간으로 렌더
            open
              ? `-# Closes <t:${this.expiresAt(party).unix()}:R>`
              : '-# 마감된 파티',
          ]
            .join('\n')
            .slice(0, 4000),
        ),
      );

    if (open) container.addActionRowComponents(this.buttons(party.id));

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2 as const,
    };
  }

  private buttons(id: string) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`party/join/${id}`)
        .setLabel('Enter')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`party/leave/${id}`)
        .setLabel('Exit')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`party/close/${id}`)
        .setLabel('Done')
        .setStyle(ButtonStyle.Danger),
    );
  }
}
