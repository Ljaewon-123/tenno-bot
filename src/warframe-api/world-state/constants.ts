import { CacheKey } from '../shared/enum';
import { ArchonBoss, CycleName } from './vo/enum';

/** 겹치는 호출(감지 → 임베드, 동시 커맨드)을 API 대신 DB로 받는다 */
export const TTL_SECONDS = 60;

/** API가 죽었을 때 만료된 캐시를 대신 내주는 상한 */
export const STALE_MAX_MINUTES = 30;

/** CacheKey는 조립할 수 없어 매핑한다 — 사이클 추가 시 ALLOWED_PATHS에도 등록 */
export const CYCLE_CACHE_KEY: Record<CycleName, CacheKey> = {
  [CycleName.Cetus]: CacheKey.WorldStateCetusCycle,
  [CycleName.Vallis]: CacheKey.WorldStateVallisCycle,
  [CycleName.Cambion]: CacheKey.WorldStateCambionCycle,
};

/**
 * 파일명이 아니라 uniqueName으로 찾는다 — 손으로 적은 파일명이 어긋나면 디스코드가 조용히 안 그린다.
 * 집정관 본체 이미지는 DB에 없어 세트 모드 엠블럼으로 대신한다.
 */
export const ArchonImage = {
  [ArchonBoss.Boreal]: {
    boss: '/Lotus/Upgrades/Mods/Sets/Boreal/BorealSetMod',
    shard: '/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal',
  },
  [ArchonBoss.Amar]: {
    boss: '/Lotus/Upgrades/Mods/Sets/Amar/AmarSetMod',
    shard: '/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmar',
  },
  [ArchonBoss.Nira]: {
    boss: '/Lotus/Upgrades/Mods/Sets/Nira/NiraSetMod',
    shard: '/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNira',
  },
};

/** 보이드 상인 본인 이미지 — 아이템이 아니라 글리프 이미지를 쓴다 */
export const VOID_TRADER_IMAGE = 'BaroKiteerAvatar.png';

/** 센티널·아크윙 본체는 무기가 아니라 Other */
export const VOID_TRADER_WEAPON_CATEGORIES: string[] = [
  'Primary',
  'Secondary',
  'Melee',
  'Arch-Gun',
  'Arch-Melee',
];
