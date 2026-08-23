import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ILike } from 'typeorm';
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
    if ((cached?.cache as string | undefined) === info.hash) return;

    const all = await this.httpJsonService.request<DropTableData>(
      HttpMethod.Get,
      'data/all.json',
    );
    await this.dropSourceService.rebuildDropSources(all);

    // 재수집이 성공한 뒤에 해시를 남긴다 — 중간에 터지면 다음 주기에 다시 시도한다
    const entity =
      cached ?? this.cacheRepository.create({ key: CacheKey.DropTable });
    entity.cache = info.hash;
    await this.cacheRepository.save(entity);
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
