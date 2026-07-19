/** drops.warframestat.us data/all.json 응답 스키마. 실제 응답을 직접 호출해 확인한 필드로 작성. */

/** 대부분의 드랍 목록에서 공통으로 쓰이는 아이템 항목 */
export interface DropReward {
  _id: string;
  itemName: string;
  rarity: string;
  chance: number;
  /** 바운티류(cetus/solaris/deimos 등)에서만 존재, 예: "Stage 1" */
  stage?: string;
  /** transientRewards에서만 존재, 로테이션 없는 보상은 undefined */
  rotation?: string;
}

/** 로테이션(A/B/C 등)이 있는 미션은 객체, 없는 미션은 배열 그대로 내려옴 */
export type DropRewardList = DropReward[] | Record<string, DropReward[]>;

export interface MissionRewardNode {
  gameMode: string;
  isEvent: boolean;
  rewards: DropRewardList;
}

/** planet -> node 이름 -> 보상 정보 */
export type MissionRewards = Record<string, Record<string, MissionRewardNode>>;

export interface Relic {
  _id: string;
  tier: 'Axi' | 'Lith' | 'Meso' | 'Neo' | 'Requiem' | 'Vanguard';
  relicName: string;
  state: 'Intact' | 'Exceptional' | 'Flawless' | 'Radiant';
  rewards: DropReward[];
}

export interface TransientReward {
  _id: string;
  objectiveName: string;
  rewards: DropReward[];
}

export interface EnemyModDrop {
  _id: string;
  enemyName: string;
  enemyModDropChance: number;
  rarity: string;
  chance: number;
}

export interface ModLocation {
  _id: string;
  modName: string;
  enemies: EnemyModDrop[];
}

export interface EnemyModTable {
  _id: string;
  enemyName: string;
  enemyModDropChance: string;
  /** 원본 데이터 오타 필드, enemyModDropChance와 값 동일 */
  ememyModDropChance: string;
  mods: DropReward[];
}

export interface EnemyBlueprintDrop {
  _id: string;
  enemyName: string;
  enemyItemDropChance: number;
  enemyBlueprintDropChance: number;
  rarity: string;
  chance: number;
}

export interface BlueprintLocation {
  _id: string;
  itemName: string;
  blueprintName: string;
  enemies: EnemyBlueprintDrop[];
}

export interface EnemyBlueprintTable {
  _id: string;
  enemyName: string;
  items: DropReward[];
  mods: DropReward[];
}

export interface KeyReward {
  _id: string;
  keyName: string;
  rewards: Record<string, DropReward[]>;
}

export interface BountyReward {
  _id: string;
  bountyLevel: string;
  rewards: Record<string, DropReward[]>;
}

export interface SyndicateItem {
  _id: string;
  item: string;
  chance: number;
  rarity: string;
  place: string;
  standing: number;
  cost?: number;
}

/** 신디케이트 이름 -> 판매/보상 아이템 목록 */
export type Syndicates = Record<string, SyndicateItem[]>;

export interface AvatarItem {
  _id: string;
  item: string;
  rarity: string;
  chance: number;
}

export interface ItemByAvatar {
  _id: string;
  source: string;
  items: AvatarItem[];
}

/** GET data/all.json 전체 응답 */
export interface DropTableData {
  missionRewards: MissionRewards;
  relics: Relic[];
  transientRewards: TransientReward[];
  modLocations: ModLocation[];
  enemyModTables: EnemyModTable[];
  blueprintLocations: BlueprintLocation[];
  enemyBlueprintTables: EnemyBlueprintTable[];
  sortieRewards: DropReward[];
  keyRewards: KeyReward[];
  cetusBountyRewards: BountyReward[];
  solarisBountyRewards: BountyReward[];
  deimosRewards: BountyReward[];
  zarimanRewards: BountyReward[];
  entratiLabRewards: BountyReward[];
  hexRewards: BountyReward[];
  syndicates: Syndicates;
  resourceByAvatar: ItemByAvatar[];
  sigilByAvatar: ItemByAvatar[];
  additionalItemByAvatar: ItemByAvatar[];
}
