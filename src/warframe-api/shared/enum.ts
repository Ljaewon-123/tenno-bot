export enum HttpMethod {
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Patch = 'patch',
  Delete = 'delete',
}

export enum CacheKey {
  DropTable = 'drop-table',
  /** 위키에서 긁은 인카논 퍽·해금 조건 45개. 만료 없이 월 1회 직접 갱신한다 */
  Incarnon = 'incarnon',
  LastSortieId = 'last-sortie-id',
  LastArchonHuntId = 'last-archon-hunt-id',
  LastEventsId = 'last-events-id',
  /** 바로 키티어가 '와 있는 동안'에만 값이 찬다 — 도착 감지용 */
  LastVoidTraderId = 'last-void-trader-id',
  LastNightwaveId = 'last-nightwave-id',
  LastArchimedeaId = 'last-archimedea-id',
  /** 월드스테이트 응답 본문 — expiresAt으로 만료된다 */
  WorldStateArchonHunt = 'world-state-archon-hunt',
  WorldStateSortie = 'world-state-sortie',
  WorldStateEvents = 'world-state-events',
  WorldStateFissures = 'world-state-fissures',
  WorldStateVoidTrader = 'world-state-void-trader',
  WorldStateNightwave = 'world-state-nightwave',
  WorldStateArchimedeas = 'world-state-archimedeas',
  WorldStateDuviriCycle = 'world-state-duviri-cycle',
  WorldStateCetusCycle = 'world-state-cetus-cycle',
  WorldStateVallisCycle = 'world-state-vallis-cycle',
  WorldStateCambionCycle = 'world-state-cambion-cycle',
}
