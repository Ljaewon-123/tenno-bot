/**
 * findItemByName이 돌려주는 아이템. @wfcd/items d.ts 유니온에는 모드 전용 필드가 빠져 있는데
 * 실물 데이터에는 들어 있어서(i18n 표기와 같은 문제) 필요한 것만 추려 선언한다.
 */
export interface DropItem {
  name: string;
  /** 레시피·재료 상수의 키. 이름과 달리 게임 업데이트에도 안 바뀐다 */
  uniqueName: string;
  type?: string;
  /** 'Mods' · 'Primary' · 'Skins' … 바로 재고를 분류하는 근거 */
  category?: string;
  description?: string;
  imageName?: string;
  /** 모드 카드 이미지 — 이름·최대 랭크 수치·설명이 전부 그려져 있다 */
  wikiaThumbnail?: string;
  baseDrain?: number;
  fusionLimit?: number;
  levelStats?: { stats: string[] }[];
}
