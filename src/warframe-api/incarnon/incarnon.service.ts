import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheKey, HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { CacheRepository } from '../shared/modules/repositories/cache.repository';
import { WfcdItemsService } from '../wfcd-items/wfcd-items.service';
import { INCARNON_MATERIALS } from './materials.const';
import { IncarnonDetail, IncarnonEntry, WikiRevisionsResponse } from './types';
import { evolutionsSection, parseEvolutions } from './wiki-parser';

/** 위키 페이지명 = `{무기} Incarnon Genesis`. wfcd 어댑터 이름과 45/45 일치한다 */
const GENESIS_SUFFIX = ' Incarnon Genesis';

/** MediaWiki API. 45개 페이지 본문이 이 호출 한 번(약 386KB)에 다 온다 */
const WIKI_API = 'api.php';

@Injectable()
export class IncarnonService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IncarnonService.name);

  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
    private readonly wfcdItemsService: WfcdItemsService,
  ) {}

  onApplicationBootstrap() {
    // await 하지 않는다 — 위키 응답을 기다리는 동안 디스코드 로그인이 막히면 안 된다
    void this.seedIfEmpty().catch((error) =>
      this.logger.error('인카논 초기 수집 실패', error),
    );
  }

  /** 캐시가 차 있으면 네트워크를 아예 안 탄다 — 퍽은 밸런스 패치 때나 바뀐다 */
  async seedIfEmpty() {
    const cached = await this.read();
    if (cached?.length) return;
    await this.sync();
  }

  /**
   * 퍽·해금 조건은 WFCD에도 DE Public Export에도 없어서 위키 표가 유일한 출처다.
   * 한 달에 한 번이면 충분하다 — 새 인카논이 추가되거나 밸런스 패치가 나야 바뀐다.
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async sync() {
    const genesis = this.wfcdItemsService.findIncarnonGenesis();
    const response = await this.httpJsonService.request<WikiRevisionsResponse>(
      HttpMethod.Get,
      WIKI_API,
      {
        params: {
          action: 'query',
          prop: 'revisions',
          rvprop: 'content',
          rvslots: 'main',
          format: 'json',
          // formatversion 2라야 pages가 객체맵이 아니라 배열로 온다
          formatversion: 2,
          titles: genesis.map((item) => item.name).join('|'),
        },
      },
    );

    const pages = response.query?.pages ?? [];
    const entries = genesis.flatMap<IncarnonEntry>((item) => {
      const content = pages.find((page) => page.title === item.name)
        ?.revisions?.[0]?.slots.main.content;
      if (!content) return [];
      const parsed = parseEvolutions(evolutionsSection(content));
      // 표가 안 잡힌 무기는 세지 않는다 — 페이지 수는 그대로라 개수만으론 못 걸러낸다
      if (!parsed.tiers.length) return [];
      return [
        {
          ...parsed,
          name: item.name.replace(GENESIS_SUFFIX, ''),
          adapter: item.uniqueName,
          imageName: item.imageName,
        },
      ];
    });

    // 위키 문법이 바뀌어 파서가 깨지면 개수부터 준다. 여기서 막지 않으면 유일한 출처가 빈 채로 덮인다
    const cached = await this.read();
    if (entries.length < (cached?.length ?? 1)) {
      this.logger.error(
        `인카논 수집 결과를 반영하지 않음 — 파싱 ${entries.length}개 / 기존 ${cached?.length ?? 0}개`,
      );
      return;
    }

    const row =
      (await this.cacheRepository.findOneBy({ key: CacheKey.Incarnon })) ??
      this.cacheRepository.create({ key: CacheKey.Incarnon });
    row.cache = entries;
    await this.cacheRepository.save(row);
  }

  /** 무기 이름으로 상세 조회. 자동완성을 안 쓰고 직접 타이핑해도 걸리도록 대소문자를 무시한다 */
  async findWeapon(name: string): Promise<IncarnonDetail | undefined> {
    const wanted = name.trim().toLowerCase();
    const found = (await this.read())?.find(
      (entry) => entry.name.toLowerCase() === wanted,
    );
    if (!found) return;

    return {
      ...found,
      thumbnail:
        found.imageName && this.wfcdItemsService.imgUrl(found.imageName),
      materials: (INCARNON_MATERIALS[found.adapter] ?? []).flatMap(
        (material) => {
          const item = this.wfcdItemsService.findItem(material.uniqueName);
          return item?.name ? [{ name: item.name, count: material.count }] : [];
        },
      ),
    };
  }

  private async read() {
    const row = await this.cacheRepository.findOneBy({
      key: CacheKey.Incarnon,
    });
    return row?.cache as IncarnonEntry[] | undefined;
  }
}
