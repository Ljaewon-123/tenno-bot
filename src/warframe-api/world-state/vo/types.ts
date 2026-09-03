import { ArchonBoss, Enemy, VoidTier } from './enum';

/** 소티/집정관 미션 3개 슬롯 중 하나 */
export interface SortieVariant {
  missionType: string; // e.g. "Exterminate", "Spy", "Rescue"
  modifier: string; // e.g. "SORTIE_MODIFIER_ENERGY_REDUCED"
  modifierDescription: string; // 사람이 읽을 수 있는 조건 설명
  node: string; // e.g. "Tessera (Venus)"
  tileset: string;
}

/** pc/sortie, pc/archonHunt 공통 스키마 */
export interface Sortie {
  id: string;
  activation: string; // ISO 8601
  expiry: string; // ISO 8601
  /** sortie: 신디케이트 보스 이름 (예: "Kela De Thaym") / archonHunt: 아콘 이름 (예: "Archon Nira") */
  boss: string;
  rewardPool: string;
  /** 항상 3개 */
  variants: SortieVariant[];
  /** 남은 시간 문자열, 예: "5h 12m" */
  eta: string;
  expired: boolean;
}

/** pc/archonHunt 미션 슬롯 (실제 응답은 variants가 아닌 missions로 내려옴) */
export interface ArchonMission {
  node: string;
  nodeKey: string;
  type: string;
  typeKey: string;
}

/** pc/archonHunt 실제 응답 스키마 (sortie와 달리 eta/expired 없음, missions/faction 있음) */
export type ArchonHunt = {
  id: string;
  activation: string;
  expiry: string;
  boss: ArchonBoss; // 아콘 이름 (예: "Archon Nira")
  faction: Enemy;
  rewardPool: string;
  missions: ArchonMission[];
};

/** pc/fissures 배열의 원소 */
export interface Fissure {
  id: string;
  activation: string;
  expiry: string;
  node: string; // e.g. "Ukko (Jupiter)"
  missionType: string;
  enemy: Enemy; // 팩션명, 예: "Grineer", "Corpus"
  tier: VoidTier;
  tierNum: number;
  expired: boolean;
  eta: string;
  /** 레일잭 보이드 스톰 여부 */
  isStorm: boolean;
  /** 강화(Steel Path) 균열 여부 */
  isHard: boolean;
}

/** pc/voidTrader 응답의 inventory 배열 원소 */
export interface VoidTraderItem {
  uniqueName: string;
  item: string;
  ducats: number;
  credits: number;
}

/** pc/voidTrader 응답의 schedule 배열 원소 (다음 방문 예정 품목) */
export interface VoidTraderSchedule {
  item: string;
  expiry: string;
}

/** pc/voidTrader (바로 키티어) 응답 스키마 */
export interface VoidTrader {
  id: string;
  activation: string;
  expiry: string;
  character: string; // 항상 "Baro Ki'Teer"
  location: string; // 예: "Strata Relay (Earth)"
  completed: boolean;
  initialStart: string;
  inventory: VoidTraderItem[];
  psId: string;
  schedule: VoidTraderSchedule[];
}

/**
 * pc/events 배열의 원소.
 * 이벤트 종류별로 실제 페이로드 구조 편차가 커서 대부분 optional로 처리했습니다.
 * index signature로 예상 못한 필드도 타입 에러 없이 받아지도록 열어둠 —
 * 실제 소비할 필드는 런타임에서 존재 여부를 확인하고 쓰는 걸 권장합니다.
 */
export interface WorldEvent {
  id: string;
  activation: string;
  expiry: string;
  active: boolean;
  expired: boolean;
  eta: string;
  description: string;
  node?: string;
  tooltip?: string;
  maximumScore?: number;
  currentScore?: number;
  rewardTypes?: string[];
  /** 써미아 파밍, 구울 퍼지 등 일부 이벤트는 세부 목표가 jobs 배열로 내려옴 */
  jobs?: unknown[];
  [key: string]: unknown;
}

/**
 * pc/{name}Cycle 공통 스키마.
 * isDay/isWarm/isCorpus처럼 사이클마다 이름이 다른 boolean이 같이 오지만 쓰지 않는다 —
 * 그걸 쓰는 순간 사이클 수만큼 타입이 갈라진다. state 문자열이면 전부 하나로 처리된다.
 */
export interface Cycle {
  id: string;
  activation: string;
  expiry: string;
  /** day|night, warm|cold, fass|vome */
  state: string;
}

/** pc/nightwave activeChallenges 배열의 원소 */
export interface NightwaveChallenge {
  id: string;
  activation: string;
  expiry: string;
  isDaily: boolean;
  isElite: boolean;
  isPermanent: boolean;
  title: string;
  desc: string;
  reputation: number;
}

/** pc/nightwave 응답 스키마 (인게임 명칭이 바뀌어도 경로/필드는 그대로다) */
export interface Nightwave {
  id: string;
  activation: string;
  expiry: string;
  season: number;
  /** 내부 시즌 태그, 예: "Radio Legion Intermission16 Syndicate" — 사람에게 보여줄 이름은 아니다 */
  tag: string;
  phase: number;
  activeChallenges: NightwaveChallenge[];
}

/** 아르키메디아 미션의 편차/위험 요소 — 스키마가 같아 한 타입으로 쓴다 */
export interface ArchimedeaCondition {
  key: string;
  name: string;
  description: string;
  /** risks에만 있다. 엘리트에서만 추가로 붙는 위험 변수 */
  isHard?: boolean;
}

export interface ArchimedeaMission {
  faction: string;
  missionType: string;
  deviation: ArchimedeaCondition;
  risks: ArchimedeaCondition[];
}

/** pc/archimedeas 배열의 원소 (심층/시간 각 1개) */
export interface Archimedea {
  id: string;
  activation: string;
  expiry: string;
  /** WFCD가 단어를 잘못 쪼개 "C T_ L A B"처럼 온다 — 공백을 지우고 ArchimedeaType과 맞춘다 */
  typeKey: string;
  missions: ArchimedeaMission[];
  personalModifiers: ArchimedeaCondition[];
}
