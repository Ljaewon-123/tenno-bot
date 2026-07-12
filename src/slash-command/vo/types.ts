import { Enemy, VoidTier } from './enum';

/** 소티/집정관 미션 3개 슬롯 중 하나 */
export interface SortieVariant {
  missionType: string; // e.g. "Exterminate", "Spy", "Rescue"
  modifier: string; // e.g. "SORTIE_MODIFIER_ENERGY_REDUCED"
  modifierDescription: string; // 사람이 읽을 수 있는 조건 설명
  node: string; // e.g. "Tessera (Venus)"
  tileset: string;
}

/** pc/sortie, pc/archonHunt 공통 스키마 */
export interface SortieDto {
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

/** pc/archonHunt 응답은 SortieDto와 동일 스키마 (스펙에서 동일 $ref 확인) */
export type ArchonHuntDto = SortieDto;

/** pc/fissures 배열의 원소 */
export interface FissureDto {
  id: string;
  activation: string;
  expiry: string;
  node: string; // e.g. "Ukko (Jupiter)"
  missionType: string;
  /** 팩션명, 예: "Grineer", "Corpus" */
  enemy: Enemy;
  tier: VoidTier;
  tierNum: number;
  expired: boolean;
  eta: string;
  /** 레일잭 보이드 스톰 여부 */
  isStorm: boolean;
  /** 강화(Steel Path) 균열 여부 */
  isHard: boolean;
}

/**
 * pc/events 배열의 원소.
 * 이벤트 종류별로 실제 페이로드 구조 편차가 커서 대부분 optional로 처리했습니다.
 * index signature로 예상 못한 필드도 타입 에러 없이 받아지도록 열어둠 —
 * 실제 소비할 필드는 런타임에서 존재 여부를 확인하고 쓰는 걸 권장합니다.
 */
export interface WorldEventDto {
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
