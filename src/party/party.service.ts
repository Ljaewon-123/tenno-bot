import dayjs from '@/utils/dayjs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { FindOptionsWhere } from 'typeorm';
import { Party } from './entities/party.entity';
import {
  PARTY_EXPIRE_HOURS,
  PartyMessageService,
} from './party-message.service';
import { PartyRepository } from './repositories/party.repository';
import { CreateParty, PartyStatus } from './vo/enum';

@Injectable()
export class PartyService {
  private readonly logger = new Logger(PartyService.name);

  constructor(
    private readonly partyRepository: PartyRepository,
    private readonly client: Client,
    private readonly partyMessage: PartyMessageService,
  ) {}

  /** members에 host 포함해서 생성 */
  async create(input: CreateParty): Promise<Party> {
    const entity = this.partyRepository.create({
      ...input,
      members: [input.hostUserId],
    });

    return this.partyRepository.save(entity);
  }

  async list(guildId: string): Promise<Party[]> {
    return this.partyRepository.findBy({
      guildId,
      status: PartyStatus.OPEN,
    });
  }

  /** 크론이 임베드를 갱신하려면 메시지 좌표가 필요하다 */
  async attachMessage(id: string, messageId: string): Promise<void> {
    await this.partyRepository.update(id, { messageId });
  }

  /** 마지막 자리 동시 클릭으로 5/4가 되지 않게*/
  async join(id: string, userId: string): Promise<Party> {
    const { affected } = await this.partyRepository
      .createQueryBuilder()
      .update(Party)
      .set({ members: () => 'array_append(members, :userId)' })
      .where('id = :id', { id })
      .andWhere('status = :open', { open: PartyStatus.OPEN })
      .andWhere('cardinality(members) < party_size')
      .andWhere('NOT (:userId = ANY(members))')
      .setParameter('userId', userId)
      .execute();

    const party = await this.get(id);
    if (!affected) {
      throw new BadRequestException(
        party.status !== PartyStatus.OPEN
          ? 'This party is closed.'
          : party.members.includes(userId)
            ? 'You have already joined.'
            : 'This party is full.',
      );
    }
    return party;
  }

  /** host는 나갈 수 없다 — 마감을 쓰라고 안내 */
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
      throw new BadRequestException(
        party.status !== PartyStatus.OPEN
          ? 'This party is closed.'
          : party.hostUserId === userId
            ? 'The host cannot leave — close the party instead.'
            : 'You have not joined this party.',
      );
    }
    return party;
  }

  /** host만 마감 가능 */
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

  /**
   * 3시간 지난 OPEN 파티 자동 마감 + 저장된 messageId 임베드 갱신.
   * 1인 1파티 제약이 호스트를 영원히 묶는 걸 막는 게 목적.
   * 한 건이 실패해도 나머지는 닫혀야 하므로 allSettled + 로깅 (NotificationService.detect() 패턴)
   */
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

    // DB는 이미 닫혔다 — 디스코드 갱신은 실패해도 다음 크론이 재시도하지 않는 best effort
    const results = await Promise.allSettled(
      parties.map(async (party) => {
        party.status = PartyStatus.CLOSE;
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

  /** 상태가 바뀐 파티의 원본 모집 메시지를 다시 그린다 */
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
