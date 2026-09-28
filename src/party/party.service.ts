import dayjs from '@/utils/dayjs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { ArrayContains, FindOptionsWhere } from 'typeorm';
import { Party } from './entities/party.entity';
import { PARTY_EXPIRE_HOURS, PARTY_HISTORY_SIZE } from './constants';
import { PartyMessageService } from './party-message.service';
import { PartyRepository } from './repositories/party.repository';
import { CreateParty } from './types';
import { PartyStatus } from './vo/enum';

@Injectable()
export class PartyService {
  private readonly logger = new Logger(PartyService.name);

  constructor(
    private readonly partyRepository: PartyRepository,
    private readonly client: Client,
    private readonly partyMessage: PartyMessageService,
  ) {}

  async create(input: CreateParty): Promise<Party> {
    await this.assertNotInAnotherParty(input.guildId, input.hostUserId);

    const entity = this.partyRepository.create({
      ...input,
      members: [input.hostUserId],
    });

    // 1인 1파티 부분 유니크 인덱스 위반(23505)은 500 대신 안내로 바꾼다
    return this.partyRepository.save(entity).catch((error) => {
      if ((error as { code?: string })?.code === '23505')
        throw new BadRequestException('You already have an open party.');
      throw error;
    });
  }

  /** 마감은 상태만 바꾸고 행을 남기므로 마감 시각은 updatedAt이 대신한다 */
  async history(guildId: string, take = PARTY_HISTORY_SIZE): Promise<Party[]> {
    return this.partyRepository.find({
      where: { guildId, status: PartyStatus.CLOSE },
      order: { updatedAt: 'DESC' },
      take,
    });
  }

  async list(guildId: string): Promise<Party[]> {
    return this.partyRepository.findBy({
      guildId,
      status: PartyStatus.OPEN,
    });
  }

  async attachMessage(id: string, messageId: string): Promise<void> {
    await this.partyRepository.update(id, { messageId });
  }

  /** 마지막 자리 동시 클릭으로 정원을 넘지 않게 조건부 UPDATE로 넣는다 */
  async join(id: string, userId: string): Promise<Party> {
    const { affected } = await this.partyRepository
      .createQueryBuilder()
      .update(Party)
      .set({ members: () => 'array_append(members, :userId)' })
      .where('id = :id', { id })
      .andWhere('status = :open', { open: PartyStatus.OPEN })
      .andWhere('cardinality(members) < party_size')
      .andWhere('NOT (:userId = ANY(members))')
      // 한 서버에서 두 파티에 동시에 못 들어간다 — 안 막으면 호스트 승계가 인덱스를 깬다(아래 handOver)
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM "party" other WHERE other."guild_id" = "party"."guild_id" AND other."status" = :open AND :userId = ANY(other."members"))`,
      )
      .setParameter('userId', userId)
      .execute();

    const party = await this.get(id);
    if (!affected) {
      throw new BadRequestException(
        party.status !== PartyStatus.OPEN
          ? 'This party is closed.'
          : party.members.includes(userId)
            ? 'You have already joined.'
            : party.members.length >= party.partySize
              ? 'This party is full.'
              : 'You are already in a party in this server.',
      );
    }
    return party;
  }

  /** host가 나가면 다음 멤버가 이어받는다 — 조건부 UPDATE는 host를 안 지우고 handOver가 받는다 */
  async leave(id: string, userId: string): Promise<Party> {
    const { affected } = await this.partyRepository
      .createQueryBuilder()
      .update(Party)
      .set({ members: () => 'array_remove(members, :userId)' })
      .where('id = :id', { id })
      .andWhere('status = :open', { open: PartyStatus.OPEN })
      .andWhere('host_user_id != :userId')
      .andWhere(':userId = ANY(members)')
      .setParameter('userId', userId)
      .execute();

    const party = await this.get(id);
    if (!affected) {
      if (party.status !== PartyStatus.OPEN)
        throw new BadRequestException('This party is closed.');
      if (party.hostUserId === userId) return this.handOver(party);
      throw new BadRequestException('You have not joined this party.');
    }
    return party;
  }

  /** 가장 먼저 들어온 남은 멤버가 호스트를 잇는다. 없으면 마감 */
  private async handOver(party: Party): Promise<Party> {
    const [next] = party.members.filter(
      (userId) => userId !== party.hostUserId,
    );
    if (!next) return this.close(party.id, party.hostUserId);

    return (
      this.partyRepository
        .createQueryBuilder()
        .update(Party)
        .set({
          hostUserId: next,
          members: () => 'array_remove(members, :userId)',
        })
        .where('id = :id', { id: party.id })
        .andWhere('status = :open', { open: PartyStatus.OPEN })
        .andWhere('host_user_id = :userId')
        .setParameter('userId', party.hostUserId)
        .execute()
        .then(() => this.get(party.id))
        // 승계를 막기 전에 만들어진 겹치는 행이 남아 있으면 1인 1파티 인덱스가 23505로 막는다
        .catch((error: { code?: string }) => {
          if (error?.code !== '23505') throw error;
          return this.close(party.id, party.hostUserId);
        })
    );
  }

  /** 유니크 인덱스는 호스트 중복만 본다 — 멤버가 새 파티를 열면 승계 때 인덱스가 터진다 */
  private async assertNotInAnotherParty(guildId: string, userId: string) {
    const joined = await this.partyRepository.existsBy({
      guildId,
      status: PartyStatus.OPEN,
      members: ArrayContains([userId]),
    });
    if (joined)
      throw new BadRequestException(
        'You are already in a party in this server.',
      );
  }

  async close(id: string, userId: string): Promise<Party> {
    const { affected } = await this.partyRepository
      .createQueryBuilder()
      .update(Party)
      .set({ status: PartyStatus.CLOSE })
      .where('id = :id', { id })
      .andWhere('status = :open', { open: PartyStatus.OPEN })
      .andWhere('host_user_id = :userId', { userId })
      .execute();

    const party = await this.get(id);
    if (!affected) {
      throw new BadRequestException(
        party.status !== PartyStatus.OPEN
          ? 'This party is already closed.'
          : 'Only the host can close this party.',
      );
    }
    return party;
  }

  /** 추방/채널 삭제 정리 — 남겨두면 만료 크론이 없는 메시지를 영원히 fetch한다 */
  async cleanup(where: FindOptionsWhere<Party>): Promise<number> {
    const { affected } = await this.partyRepository.delete(where);
    return affected ?? 0;
  }

  /** 1인 1파티 제약이 호스트를 영원히 묶지 않게 오래된 OPEN 파티를 마감한다 */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async expire(): Promise<void> {
    const parties = await this.partyRepository
      .createQueryBuilder('party')
      .where('party.status = :open', { open: PartyStatus.OPEN })
      .andWhere('party.createdAt < :deadline', {
        deadline: dayjs().subtract(PARTY_EXPIRE_HOURS, 'hour').toISOString(),
      })
      .getMany();
    if (!parties.length) return;

    await this.partyRepository.update(
      parties.map(({ id }) => id),
      { status: PartyStatus.CLOSE },
    );
    this.logger.log(`만료 파티 ${parties.length}건 마감`);

    // DB는 이미 닫혔다 — 디스코드 갱신은 best effort
    const results = await Promise.allSettled(
      parties.map(async (party) => {
        party.status = PartyStatus.CLOSE;
        // 안 옮기면 카드 푸터가 마감 전 시각으로 찍힌다
        party.updatedAt = dayjs();
        await this.refresh(party);
      }),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `파티 ${parties[index].id} 임베드 갱신 실패`,
          result.reason,
        );
      }
    });
  }

  private async refresh(party: Party): Promise<void> {
    if (!party.channelId || !party.messageId) return;
    const channel = await this.client.channels.fetch(party.channelId);
    if (!channel?.isTextBased()) return;
    const message = await channel.messages.fetch(party.messageId);
    await message.edit(this.partyMessage.build(party));
  }

  /** 조건부 UPDATE가 0행이면 사유를 알려주지 않으므로 매번 다시 읽어 분기한다 */
  private async get(id: string): Promise<Party> {
    const party = await this.partyRepository.findOneBy({ id });
    if (!party) throw new BadRequestException('Party not found.');
    return party;
  }
}
