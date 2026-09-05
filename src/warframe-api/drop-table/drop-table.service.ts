import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheKey, HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { CacheRepository } from '../shared/modules/repositories/cache.repository';
import { DropSourceService } from './drop-source.service';
import { DropSourceRepository } from './repositories/drop-source.repository';
import { DropTableData, DropTableInfo } from './types';
import { DropCategory } from './vo/enum';

// relics/missionRewards/modLocations 등 정적 드랍테이블은 Prime Access 단위(분기~수개월)로만 바뀜.
// 변경 주기가 예측 불가하므로 주 1회 all.json 통째로 재수집해 Postgres에 덮어쓰는 방식.
// 효율화하려면 info.json(hash/modified)을 먼저 확인해 변경 시에만 all.json 재수집.
// 주된 기능은 특정 아이템은 어떤 미션 혹은 어떤 드랍에서 얻을 수있는지가 우선순위
// 1. 목표 아이템은 특정 성유물 (또는 성유물을 까서 나오는 프라임 부품)
// 2. 특정 미션, 혹은 특정 몹을 잡아야 드랍되는 모드
// 3. 특정 미션에서만 얻을수있는 모드 또한 표시 (상승 미션 등등)
// 인덱스 구축 규칙(제외 목록·평탄화)을 바꾸면 올린다 — 원본 hash가 그대로여도
// 재구축이 필요한데, 이걸 hash에 붙여두면 다음 부팅에 알아서 다시 만든다
const INDEX_VERSION = 'v2';

@Injectable()
export class DropTableService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DropTableService.name);

  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
    private readonly dropSourceRepository: DropSourceRepository,
    private readonly dropSourceService: DropSourceService,
  ) {}

  // 부팅 시 1회 시딩 — 크론만 있으면 새 DB가 다음 일요일까지 빈 채로 있다.
  // hash가 같으면 info.json 한 번 찍고 리턴이라 재배포마다 돌아도 싸다.
  // await 하지 않는다 — all.json 파싱/insert가 끝날 때까지 디스코드 로그인이 막히면 안 된다
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

  /**
   * 역인덱스 검색. 부분 일치, 확률 높은 순.
   * 이름이 정확히 맞는 아이템을 앞으로 뺀다 — 확률만으로 자르면 'Pressure Point'가
   * 확률 높은 'Necramech Pressure Point' 행에 50칸을 다 뺏겨 통째로 사라진다
   */
  async findDropSources(itemName: string, category?: DropCategory) {
    const query = this.dropSourceRepository
      .createQueryBuilder('drop')
      .where('drop.itemName ILIKE :like', { like: `%${itemName}%` })
      .orderBy('drop.itemName ILIKE :exact', 'DESC')
      .addOrderBy('drop.chance', 'DESC')
      .setParameter('exact', itemName)
      .take(50);
    if (category) query.andWhere('drop.category = :category', { category });
    return query.getMany();
  }

  /** 오토컴플리트용 이름 검색. 디스코드 선택지 상한이 25개라 거기서 자른다 */
  async searchItemNames(keyword: string) {
    const rows = await this.dropSourceRepository
      .createQueryBuilder('drop')
      .select('DISTINCT drop.itemName', 'itemName')
      .where('drop.itemName ILIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('drop.itemName')
      .limit(25)
      .getRawMany<{ itemName: string }>();
    return rows.map((row) => row.itemName);
  }
}
