import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheKey, HttpMethod } from '../shared/enum.js';
import { HttpJsonService } from '../shared/http-json.service.js';
import { CacheRepository } from '../shared/modules/repositories/cache.repository.js';
import { INDEX_VERSION } from './constants.js';
import { DropSourceService } from './drop-source.service.js';
import { DropSourceRepository } from './repositories/drop-source.repository.js';
import { DropTableData, DropTableInfo } from './types.js';
import { DropCategory } from './vo/enum.js';

/** 드랍테이블은 Prime Access 단위로만 바뀐다 — 주 1회 info.json 해시가 바뀌었을 때만 all.json을 재수집한다 */
@Injectable()
export class DropTableService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DropTableService.name);

  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
    private readonly dropSourceRepository: DropSourceRepository,
    private readonly dropSourceService: DropSourceService,
  ) {}

  // 부팅 시 1회 시딩 — 크론만 있으면 새 DB가 다음 주까지 비어 있다. await하면 디스코드 로그인이 막힌다
  onApplicationBootstrap() {
    void this.getAllDropTables().catch((error) =>
      this.logger.error('drop table 초기 수집 실패', error),
    );
  }

  @Cron(CronExpression.EVERY_WEEK)
  async getAllDropTables() {
    const info = await this.httpJsonService.request<DropTableInfo>(
      HttpMethod.Get,
      'data/info.json',
    );
    const cached = await this.cacheRepository.findOneBy({
      key: CacheKey.DropTable,
    });
    const stamp = `${INDEX_VERSION}:${info.hash}`;
    if ((cached?.cache as string | undefined) === stamp) return;

    const all = await this.httpJsonService.request<DropTableData>(
      HttpMethod.Get,
      'data/all.json',
    );
    await this.dropSourceService.rebuildDropSources(all);

    // 재수집이 성공한 뒤에 해시를 남긴다 — 중간에 터지면 다음 주기에 다시 시도한다
    const entity =
      cached ?? this.cacheRepository.create({ key: CacheKey.DropTable });
    entity.cache = stamp;
    await this.cacheRepository.save(entity);
  }

  /** 정확히 맞는 이름을 앞으로 — 확률 순으로만 자르면 'Pressure Point'가 'Necramech Pressure Point'에 밀려 사라진다 */
  async findDropSources(itemName: string, category?: DropCategory) {
    const query = this.dropSourceRepository
      .createQueryBuilder('drop')
      .where('drop.itemName ILIKE :like', {
        like: `%${this.escapeLike(itemName)}%`,
      })
      .orderBy('drop.itemName ILIKE :exact', 'DESC')
      .addOrderBy('drop.chance', 'DESC')
      // 확률 동률이 흔해서 2차 정렬이 없으면 페이지마다 순서가 흔들린다
      .addOrderBy('drop.sourceName', 'ASC')
      .setParameter('exact', this.escapeLike(itemName))
      .take(50);
    if (category) query.andWhere('drop.category = :category', { category });
    return query.getMany();
  }

  /** 역방향 — sourceName으로 읽는다. 보상은 최대 8개라 상한이 없다 */
  async findRelicRewards(relicName: string) {
    return this.dropSourceRepository.find({
      where: { category: DropCategory.Relic, sourceName: relicName },
      order: { chance: 'DESC', itemName: 'ASC' },
    });
  }

  /** 성유물은 773개, 자동완성 상한은 25개 */
  async searchRelicNames(keyword: string) {
    const rows = await this.dropSourceRepository
      .createQueryBuilder('drop')
      .select('DISTINCT drop.sourceName', 'sourceName')
      .where('drop.category = :category', { category: DropCategory.Relic })
      .andWhere('drop.sourceName ILIKE :keyword', {
        keyword: `%${this.escapeLike(keyword)}%`,
      })
      .orderBy('drop.sourceName')
      .limit(25)
      .getRawMany<{ sourceName: string }>();
    return rows.map((row) => row.sourceName);
  }

  async searchItemNames(keyword: string) {
    const rows = await this.dropSourceRepository
      .createQueryBuilder('drop')
      .select('DISTINCT drop.itemName', 'itemName')
      .where('drop.itemName ILIKE :keyword', {
        keyword: `%${this.escapeLike(keyword)}%`,
      })
      .orderBy('drop.itemName')
      .limit(25)
      .getRawMany<{ itemName: string }>();
    return rows.map((row) => row.itemName);
  }

  /** 유저 입력의 %·_가 와일드카드로 동작하지 않게 한다 (Postgres LIKE 기본 이스케이프 문자는 \) */
  private escapeLike(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
