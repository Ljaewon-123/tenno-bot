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
      materials: this.materials(found.adapter),
    };
  }

  /**
   * 위키 수집 전에도 쓸 수 있는 부분. 설치 재료·어댑터 아이콘은 DE 익스포트에서 오므로
   * 퍽이 비어 있어도 있다 — "그런 무기 없음"과 "아직 안 모았음"을 가르는 근거이기도 하다.
   */
  install(name: string) {
    const wanted = `${name.trim().toLowerCase()}${GENESIS_SUFFIX.toLowerCase()}`;
    const item = this.wfcdItemsService
      .findIncarnonGenesis()
      .find((genesis) => genesis.name.toLowerCase() === wanted);
    if (!item) return;

    return {
      name: item.name.replace(GENESIS_SUFFIX, ''),
      thumbnail: item.imageName && this.wfcdItemsService.imgUrl(item.imageName),
      materials: this.materials(item.uniqueName),
    };
  }

  /**
   * 오타 났을 때 되짚을 이름. 앞글자가 겹치는 순으로 둘만 준다 —
   * 45종을 통째로 나열하는 건 답이 아니고, 재시도는 한 번에 끝나야 한다.
   */
  suggest(name: string) {
    const wanted = name.trim().toLowerCase();
    const names = this.wfcdItemsService
      .findIncarnonGenesis()
      .map((item) => item.name.replace(GENESIS_SUFFIX, ''));

    const shared = (candidate: string) => {
      let index = 0;
      const lower = candidate.toLowerCase();
      while (index < wanted.length && wanted[index] === lower[index])
        index += 1;
      return index;
    };

    return {
      total: names.length,
      // 1글자만 겹치는 건 우연이다 — 엉뚱한 이름을 들이밀면 오타를 고치는 데 더 방해된다
      closest: names
        .filter((candidate) => shared(candidate) >= 2)
        .sort((a, b) => shared(b) - shared(a) || a.localeCompare(b))
        .slice(0, 2),
    };
  }

  /** 재료 이름은 uniqueName으로 wfcd에서 붙인다 — 상수에는 개수와 uniqueName만 있다 */
  private materials(adapter: string) {
    return (INCARNON_MATERIALS[adapter] ?? []).flatMap((material) => {
      const item = this.wfcdItemsService.findItem(material.uniqueName);
      return item?.name ? [{ name: item.name, count: material.count }] : [];
    });
  }

  private async read() {
    const row = await this.cacheRepository.findOneBy({
      key: CacheKey.Incarnon,
    });
    return row?.cache as IncarnonEntry[] | undefined;
  }
}
