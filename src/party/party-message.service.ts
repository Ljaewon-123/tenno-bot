import { Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
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
    const embed = new EmbedBuilder()
      .setTitle(party.name)
      .setColor(open ? 0x5865f2 : 0x4e5058)
      .addFields(
        { name: 'Mission', value: party.mission.slice(0, 1024) },
        {
          name: `Members (${party.members.length}/${party.partySize})`,
          value:
            party.members.map((userId) => `<@${userId}>`).join('\n') || '없음',
        },
      );

    // 3시간 뒤 크론이 조용히 닫으면 "갑자기 닫혔다"로 읽힌다. 디스코드가 뷰어 로컬 시간으로 렌더
    if (open) {
      embed.addFields({
        name: 'Closes',
        value: `<t:${this.expiresAt(party).unix()}:R>`,
      });
    } else {
      embed.setFooter({ text: '마감된 파티' });
    }

    return {
      embeds: [embed],
      components: open ? [this.buttons(party.id)] : [],
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
