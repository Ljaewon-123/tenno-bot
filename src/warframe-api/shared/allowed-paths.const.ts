/** HttpJsonService가 요청을 보낼 수 있는 상대 경로 화이트리스트. 새 엔드포인트를 추가할 땐 여기에도 등록해야 함. */
// path를 직접 받지는 않아서 괜찮을거
export const ALLOWED_PATHS = new Set<string>([
  'pc/archonHunt',
  'pc/sortie',
  'pc/events',
  'pc/fissures',
  'pc/voidTrader',
  'data/all.json',
]);
