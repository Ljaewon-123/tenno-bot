/** 절대 URL이 들어오면 axios가 baseURL을 무시해 SSRF가 된다 — 새 엔드포인트는 여기 등록한다 */
export const ALLOWED_PATHS = new Set<string>([
  'pc/archonHunt',
  'pc/sortie',
  'pc/events',
  'pc/fissures',
  'pc/voidTrader',
  'pc/nightwave',
  'pc/archimedeas',
  'pc/duviriCycle',
  'pc/cetusCycle',
  'pc/vallisCycle',
  'pc/cambionCycle',
  'data/all.json',
  'data/info.json',
  // wiki.warframe.com MediaWiki API — 질의는 params로 나간다
  'api.php',
]);
