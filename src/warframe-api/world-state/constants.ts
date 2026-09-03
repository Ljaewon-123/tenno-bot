import { CacheKey } from '../shared/enum';
import { CycleName } from './vo/enum';

/**
 * worldstate 응답을 Cache 테이블에 담아두는 시간.
 * 변화 감지 크론이 10분 주기라 1분 TTL은 커서 판정에 영향이 없고,
 * 겹치는 호출(감지 → 임베드 생성, 여러 유저의 동시 커맨드)을 API 대신 DB로 받아낸다.
 */
export const TTL_SECONDS = 60;

/**
 * 경로는 `pc/${name}Cycle`로 조립되지만 CacheKey는 enum이라 조립할 수 없다.
 * 사이클을 추가할 땐 여기와 ALLOWED_PATHS 양쪽에 등록해야 한다.
 */
export const CYCLE_CACHE_KEY: Record<CycleName, CacheKey> = {
  [CycleName.Cetus]: CacheKey.WorldStateCetusCycle,
  [CycleName.Vallis]: CacheKey.WorldStateVallisCycle,
  [CycleName.Cambion]: CacheKey.WorldStateCambionCycle,
};
