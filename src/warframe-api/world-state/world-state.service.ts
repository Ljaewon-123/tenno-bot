import dayjs from '@/utils/dayjs';
import { Injectable, Logger } from '@nestjs/common';
import { CacheKey, HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { CacheRepository } from '../shared/modules/repositories/cache.repository';
import { CYCLE_CACHE_KEY, STALE_MAX_MINUTES, TTL_SECONDS } from './constants';
import { markStale, staleAsOf } from './stale';
import { CycleName, VoidTier } from './vo/enum';
import {
  Archimedea,
  ArchonHunt,
  Cycle,
  DuviriCycle,
  Fissure,
  Nightwave,
  Sortie,
  VoidTrader,
  WorldEvent,
} from './vo/types';

@Injectable()
export class WorldStateService {
  private readonly logger = new Logger(WorldStateService.name);

  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
  ) {}

  /** 집정관 */
  async archonHunt(): Promise<ArchonHunt> {
    return this.get(CacheKey.WorldStateArchonHunt, 'pc/archonHunt');
  }

  /** 출격 (소티) */
  async sortie(): Promise<Sortie> {
    return this.get(CacheKey.WorldStateSortie, 'pc/sortie');
  }

  /** 이벤트 */
  async events(): Promise<WorldEvent[]> {
    return this.get(CacheKey.WorldStateEvents, 'pc/events');
  }

  /** 보이드 균열 */
  async voidFissures(options?: VoidTier): Promise<Fissure[]> {
    const fissures = await this.get<Fissure[]>(
      CacheKey.WorldStateFissures,
      'pc/fissures',
    );
    if (!options?.length) return fissures;

    // 거른 배열은 새 객체라 나이 표시가 끊긴다 — 같은 응답이므로 표식을 옮겨 준다
    const filtered = fissures.filter((f) => options.includes(f.tier));
    const asOf = staleAsOf(fissures);
    if (asOf) markStale(filtered, asOf);
    return filtered;
  }

  /** 보이드 상인 (바로 키티어) */
  async voidTrader(): Promise<VoidTrader> {
    return this.get(CacheKey.WorldStateVoidTrader, 'pc/voidTrader');
  }

  /** 나이트웨이브 (인게임 명칭은 바뀌었지만 API 경로는 그대로) */
  async nightwave(): Promise<Nightwave> {
    return this.get(CacheKey.WorldStateNightwave, 'pc/nightwave');
  }

  /** 아르키메디아 — 심층/시간이 한 배열로 온다 */
  async archimedeas(): Promise<Archimedea[]> {
    return this.get(CacheKey.WorldStateArchimedeas, 'pc/archimedeas');
  }

  /** 두비리 사이클 — 서킷 주간 로테이션(choices)을 여기서 얻는다 */
  async duviriCycle(): Promise<DuviriCycle> {
    return this.get(CacheKey.WorldStateDuviriCycle, 'pc/duviriCycle');
  }

  /** 오픈월드 낮/밤 사이클 */
  async cycle(name: CycleName): Promise<Cycle> {
    return this.get(CYCLE_CACHE_KEY[name], `pc/${name}Cycle`);
  }

  /**
   * 요청이 실패하면 아무것도 쓰지 않아 다음 호출이 그대로 재시도한다.
   * 밀리초 단위로 겹친 동시 호출은 각자 API를 때린다 — 필요해지면 in-flight Promise 맵을 얹으면 됨.
   */
  private async get<T>(key: CacheKey, path: string): Promise<T> {
    const now = dayjs();
    const cached = await this.cacheRepository.findOneBy({ key });
    if (cached?.expiresAt?.isAfter(now)) return cached.cache as T;

    const staleUntil = cached?.expiresAt?.add(STALE_MAX_MINUTES, 'minute');
    let servedStale = false;

    const response = await this.httpJsonService
      .request<T>(HttpMethod.Get, path)
      .catch((error: Error) => {
        // 만료됐어도 캐시가 있으면 그게 에러 카드보다 낫다 — 월드스테이트는 분 단위로 안 변한다.
        // 실제 나이는 stale.ts가 들고 카드 footer가 `cached <t:..:R>`로 적는다
        if (!cached || !staleUntil?.isAfter(now)) throw error;
        servedStale = true;
        this.logger.warn(
          `${path} 실패 — 만료된 캐시로 대체한다: ${error.message}`,
        );
        return cached.cache as T;
      });

    // 스테일은 캐시를 갱신하지 않는다 — 새로 받은 것처럼 TTL을 밀면 API가 살아나도 60초를 더 기다린다
    if (servedStale) {
      // 받아진 시각은 따로 없다. expiresAt에서 TTL을 빼면 그게 마지막 성공 시각이다
      if (cached?.expiresAt)
        markStale(response, cached.expiresAt.subtract(TTL_SECONDS, 'second'));
      return response;
    }

    const entity = cached ?? this.cacheRepository.create({ key });
    entity.cache = response;
    entity.expiresAt = now.add(TTL_SECONDS, 'second');
    await this.cacheRepository.save(entity);

    return response;
  }
}
