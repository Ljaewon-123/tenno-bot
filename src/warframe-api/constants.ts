/** 그룹당 펴는 줄 수 — 안 접으면 컴포넌트 40개 한도를 넘는다 */
export const TOP = { fissure: 2, drop: 6 } as const;

export const TRADER_PEEK = 5;

export const TRADER_ALL = 'all';

export const INCARNON_KEY = 'incarnon';

export const EVO_NUMERAL: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
};

/** 퍽 1개 = Section + 글 + 아이콘 = 컴포넌트 3개 */
export const PERK_SLOTS = 3;

/** 퍽을 뺀 나머지: 헤더 Section 3 + 재료·EVO 헤딩 4 + 구분선 2 + 버튼 행 2 + 푸터 1 */
export const INCARNON_FIXED_SLOTS = 12;

export const DROP_KEY = 'drop';
export const DROP_ALL = 'all';

/** 성유물 이름은 customId가 아니라 셀렉트 값에 싣는다 — customId는 100자 제한이 빡빡하다 */
export const RELIC_OPEN = 'relic/open';
export const RELIC_REWARD = 'relic/reward';

/** customId의 필터 축에서 "안 걸림"을 뜻하는 값. 축을 비워 두면 세그먼트 수가 달라져 라우팅이 깨진다 */
export const FILTER_OFF = 'all';
export const ARCHIMEDEA_DETAIL = 'detail';
export const FISSURE_HARD = 'sp';
/** paged()가 key 뒤에 붙이는 꼬리. 페이지 번호가 세 자리를 넘길 목록은 없다 */
export const PAGE_SUFFIX_LENGTH = '/page/999'.length;
