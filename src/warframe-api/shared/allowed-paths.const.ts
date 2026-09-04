/** HttpJsonService가 요청을 보낼 수 있는 상대 경로 화이트리스트. 새 엔드포인트를 추가할 땐 여기에도 등록해야 함. */
// path를 직접 받지는 않아서 괜찮을거
export const ALLOWED_PATHS = new Set<string>([
  'pc/archonHunt',
  'pc/sortie',
  'pc/events',
  'pc/fissures',
  'pc/voidTrader',
  'pc/nightwave',
  // 심층/시간 아르키메디아가 한 배열로 같이 온다 — 단독 엔드포인트는 없다
  'pc/archimedeas',
  // 서킷(두비리) 주간 로테이션 — 인카논 제네시스 목록이 choices에 들어온다
  'pc/duviriCycle',
  'pc/cetusCycle',
  'pc/vallisCycle',
  'pc/cambionCycle',
  'data/all.json',
  'data/info.json',
]);
