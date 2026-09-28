/** 인덱스 구축 규칙을 바꾸면 올린다 — 해시가 그대로여도 다음 부팅에 재구축된다 */
export const INDEX_VERSION = 'v4';

/** 게임에서 제거된 열화판(Flawed) 모드 — 정식 모드와 이름이 겹쳐 검색 노이즈만 준다 */
export const EXCLUDED_ITEM = /^Flawed /i;
