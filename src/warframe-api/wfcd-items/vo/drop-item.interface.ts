/** @wfcd/items d.ts에 빠진 필드를 포함해 필요한 것만 선언한다 */
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
  /** 성유물만 — 지금 드랍되지 않으면 true. @see WfcdItemsService.findRelic */
  vaulted?: boolean;
  /** 부품 이름으로 상위 아이템을 찾는 경로 — 부품 자체 이미지는 공용 아이콘이다 */
  components?: { name: string; imageName?: string }[];
}
