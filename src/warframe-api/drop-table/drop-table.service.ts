import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ILike } from 'typeorm';
import { HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { DropSourceService } from './drop-source.service';
import { CacheRepository } from './repositories/cache.repository';
import { DropSourceRepository } from './repositories/drop-source.repository';
import { DropTableData } from './types';
import { CacheKey, DropCategory } from './vo/enum';

// relics/missionRewards/modLocations 등 정적 드랍테이블은 Prime Access 단위(분기~수개월)로만 바뀜.
// 변경 주기가 예측 불가하므로 주 1회 all.json 통째로 재수집해 Postgres에 덮어쓰는 방식.
// 효율화하려면 info.json(hash/modified)을 먼저 확인해 변경 시에만 all.json 재수집.
// 주된 기능은 특정 아이템은 어떤 미션 혹은 어떤 드랍에서 얻을 수있는지가 우선순위
// 1. 목표 아이템은 특정 성유물 (또는 성유물을 까서 나오는 프라임 부품)
// 2. 특정 미션, 혹은 특정 몹을 잡아야 드랍되는 모드
// 3. 특정 미션에서만 얻을수있는 모드 또한 표시 (상승 미션 등등)
@Injectable()
export class DropTableService {
  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
    private readonly dropSourceRepository: DropSourceRepository,
    private readonly dropSourceService: DropSourceService,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS) // dev mode
  @Cron(CronExpression.EVERY_WEEK)
  async getAllDropTables() {
    const all = await this.httpJsonService.request<DropTableData>(
      HttpMethod.Get,
      'data/all.json',
    );
    const entity = this.cacheRepository.create({
      cache: JSON.stringify(all),
      key: CacheKey.DropTable,
    });
    await this.cacheRepository.save(entity);
    return this.dropSourceService.rebuildDropSources(all);
  }

  /** 역인덱스 검색. 부분 일치, 확률 높은 순 */
  async findDropSources(itemName: string, category?: DropCategory) {
    return this.dropSourceRepository.find({
      where: {
        itemName: ILike(`%${itemName}%`),
        ...(category && { category }),
      },
      order: { chance: 'DESC' },
      take: 50,
    });
  }
}
