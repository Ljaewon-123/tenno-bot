export enum VoidTier {
  Lith = 'Lith',
  Meso = 'Meso',
  Neo = 'Neo',
  Axi = 'Axi',
  Requiem = 'Requiem',
  Omnia = 'Omnia',
}

export enum Enemy {
  Grineer = 'Grineer',
  Corpus = 'Corpus',
  Infested = 'Infested',
  Sentient = 'Sentient',
  Techrot = 'Techrot',
  Scladra = 'Scladra',
  Murmur = 'Murmur',
  Narmer = 'Narmer',
  Orokin = 'Orokin',
}

export enum ArchonBoss {
  Boreal = 'Archon Boreal',
  Amar = 'Archon Amar',
  Nira = 'Archon Nira',
}

export const ArchonReward = {
  [ArchonBoss.Boreal]: 'Azure',
  [ArchonBoss.Amar]: 'Crimson',
  [ArchonBoss.Nira]: 'Amber',
};

/** 재고 응답엔 카테고리가 없어 아이템 DB의 category에서 파생한다 */
export enum VoidTraderCategory {
  Mods = 'mods',
  Weapons = 'weapons',
  Other = 'other',
}

export const VoidTraderCategoryLabel: Record<VoidTraderCategory, string> = {
  [VoidTraderCategory.Mods]: 'Mods',
  [VoidTraderCategory.Weapons]: 'Weapons',
  [VoidTraderCategory.Other]: 'Cosmetics & Other',
};

export const isVoidTraderCategory = (
  value: string,
): value is VoidTraderCategory =>
  (Object.values(VoidTraderCategory) as string[]).includes(value);

/** 나이트웨이브 필터 — 엘리트는 주간에 포함된다(주기가 같아서 따로 볼 이유가 없다) */
export enum NightwaveFilter {
  Daily = 'daily',
  Weekly = 'weekly',
}

export const isNightwaveFilter = (value: string): value is NightwaveFilter =>
  (Object.values(NightwaveFilter) as string[]).includes(value);

export const isCycleName = (value: string): value is CycleName =>
  (Object.values(CycleName) as string[]).includes(value);

export const isVoidTier = (value: string): value is VoidTier =>
  (Object.values(VoidTier) as string[]).includes(value);

/** 시간대가 게임플레이를 바꾸는 오픈월드만(지구 제외). 값이 그대로 pc/{name}Cycle 경로가 된다 */
export enum CycleName {
  Cetus = 'cetus',
  Vallis = 'vallis',
  Cambion = 'cambion',
}

export const CycleLabel = {
  [CycleName.Cetus]: 'Plains of Eidolon (Earth)',
  [CycleName.Vallis]: 'Orb Vallis (Venus)',
  [CycleName.Cambion]: 'Cambion Drift (Deimos)',
};

/** pc/archimedeas typeKey에서 공백을 지운 값 */
export enum ArchimedeaType {
  Deep = 'CT_LAB',
  Temporal = 'CT_HEX',
}

export const ArchimedeaLabel = {
  [ArchimedeaType.Deep]: 'Deep Archimedea',
  [ArchimedeaType.Temporal]: 'Temporal Archimedea',
};

/** pc/duviriCycle choices의 categoryKey. hard(스틸패스 서킷)만 인카논 제네시스를 준다 */
export enum CircuitCategory {
  Normal = 'EXC_NORMAL',
  Hard = 'EXC_HARD',
}

export const CycleIcon = {
  [CycleName.Cetus]: '☀️',
  [CycleName.Vallis]: '🔥',
  [CycleName.Cambion]: '🟣',
};

/** API는 현재 state만 준다 — 2상태라 다음은 반대쪽. 모르는 state면 화살표를 생략한다 */
export const CycleNextState: Record<string, string> = {
  day: 'night',
  night: 'day',
  warm: 'cold',
  cold: 'warm',
  fass: 'vome',
  vome: 'fass',
};
