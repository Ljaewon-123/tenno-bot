export enum HttpMethod {
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Patch = 'patch',
  Delete = 'delete',
}

export enum CacheKey {
  DropTable = 'drop-table',
  LastSortieId = 'last-sortie-id',
  LastArchonHuntId = 'last-archon-hunt-id',
  LastEventsId = 'last-events-id',
  /** 바로 키티어가 '와 있는 동안'에만 값이 찬다 — 도착 감지용 */
  LastVoidTraderId = 'last-void-trader-id',
  /** 월드스테이트 응답 본문 — expiresAt으로 만료된다 */
  WorldStateArchonHunt = 'world-state-archon-hunt',
  WorldStateSortie = 'world-state-sortie',
  WorldStateEvents = 'world-state-events',
  WorldStateFissures = 'world-state-fissures',
  WorldStateVoidTrader = 'world-state-void-trader',
}
