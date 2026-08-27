import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { FindOptionsWhere } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Party } from './entities/party.entity';
import { PartyRepository } from './repositories/party.repository';
import { CreateParty, PartyStatus } from './vo/enum';

@Injectable()
export class PartyService {
  private readonly logger = new Logger(PartyService.name);

  constructor(
    private readonly partyRepository: PartyRepository,
    private readonly client: Client,
  ) {}

  /** members에 host 포함해서 생성 */
  async create(input: CreateParty): Promise<Party> {
    const entity = this.partyRepository.create(input);
    return this.partyRepository.save(entity);
  }

  async list(guildId: string): Promise<Party[]> {
    return this.partyRepository.findBy({
      guildId,
    });
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

    const party = await this.partyRepository.findOneBy({ id });
    if (!party) throw new BadRequestException('Party not found.');
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
  @Transactional()
  async leave(id: string, userId: string): Promise<Party> {
    throw new Error('not implemented');
  }

  /** host만 마감 가능 */
  @Transactional()
  async close(id: string, userId: string): Promise<Party> {
    throw new Error('not implemented');
  }

  /** 추방/채널 삭제 정리 — 남겨두면 만료 크론이 없는 메시지를 영원히 fetch한다 */
  async cleanup(where: FindOptionsWhere<Party>): Promise<number> {
    throw new Error('not implemented');
  }

  /**
   * 3시간 지난 OPEN 파티 자동 마감 + 저장된 messageId 임베드 갱신.
   * 1인 1파티 제약이 호스트를 영원히 묶는 걸 막는 게 목적.
   * 한 건이 실패해도 나머지는 닫혀야 하므로 allSettled + 로깅 (NotificationService.detect() 패턴)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async expire(): Promise<void> {
    throw new Error('not implemented');
  }
}
